import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayFastSignature, verifyPayFastMerchant } from "@/lib/payfast";
import { v4 as uuidv4 } from "uuid";

// POST /api/webhooks/payfast — PayFast ITN callback
export async function POST(request: Request) {
  const body = await request.text();
  const params: Record<string, string> = {};
  for (const pair of body.split("&")) {
    const [key, value] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  }

  // 1. Verify signature
  if (!verifyPayFastSignature(params, process.env.PAYFAST_PASSPHRASE)) {
    console.error("PayFast ITN: Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Verify merchant
  if (!verifyPayFastMerchant(params)) {
    console.error("PayFast ITN: Invalid merchant");
    return NextResponse.json({ error: "Invalid merchant" }, { status: 400 });
  }

  // 3. Get order
  const orderId = params.m_payment_id;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    console.error("PayFast ITN: Order not found", orderId);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 4. Verify amount
  const paidAmount = parseFloat(params.amount_gross);
  const expectedAmount = order.amount_cents / 100;
  if (Math.abs(paidAmount - expectedAmount) > 0.01) {
    console.error("PayFast ITN: Amount mismatch", paidAmount, expectedAmount);
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  // 5. Check payment status
  if (params.payment_status !== "COMPLETE") {
    // Update order status to cancelled if failed
    if (params.payment_status === "CANCELLED") {
      await admin
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }
    return NextResponse.json({ status: "noted" });
  }

  // 6. Already processed?
  if (order.status === "paid") {
    return NextResponse.json({ status: "already_processed" });
  }

  // 7. Mark order as paid
  await admin
    .from("orders")
    .update({
      status: "paid",
      payfast_payment_id: params.pf_payment_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  // 8. Create entitlements/codes based on order type
  if (order.order_type === "b2c") {
    // B2C: Create entitlement for buyer (attempts_allowed=1)
    await admin.from("entitlements").insert({
      user_id: order.user_id,
      quiz_id: order.quiz_id,
      order_id: order.id,
      attempts_allowed: 1,
      attempts_used: 0,
    });
  } else if (order.order_type === "corporate") {
    // Corporate: Generate N unique redeem codes
    const codes = [];
    for (let i = 0; i < order.quantity; i++) {
      codes.push({
        order_id: order.id,
        quiz_id: order.quiz_id,
        code: uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase(),
      });
    }
    await admin.from("redeem_codes").insert(codes);
  }

  return NextResponse.json({ status: "ok" });
}

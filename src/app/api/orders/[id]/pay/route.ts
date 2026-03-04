import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPayFastPayload, generatePayFastSignature, getPayFastUrl } from "@/lib/payfast";

// POST /api/orders/[id]/pay — Generate PayFast redirect URL
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, quizzes(title)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const quizTitle = (order as Record<string, unknown>).quizzes
    ? ((order as Record<string, unknown>).quizzes as { title: string }).title
    : "Quiz";

  const payload = buildPayFastPayload({
    orderId: order.id,
    amountCents: order.amount_cents,
    itemName: `The Quiz House: ${quizTitle}`,
    email: user.email,
  });

  // Generate signature
  const dataForSig: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) dataForSig[k] = String(v);
  }
  const signature = generatePayFastSignature(
    dataForSig,
    process.env.PAYFAST_PASSPHRASE
  );

  return NextResponse.json({
    payfast_url: getPayFastUrl(),
    payload: { ...dataForSig, signature },
  });
}

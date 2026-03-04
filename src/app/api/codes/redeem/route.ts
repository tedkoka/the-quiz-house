import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/codes/redeem — Redeem a corporate code
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the code
  const { data: redeemCode } = await admin
    .from("redeem_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (!redeemCode) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  if (redeemCode.used_by) {
    return NextResponse.json(
      { error: "Code already redeemed" },
      { status: 409 }
    );
  }

  // Get the order to find the quiz
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", redeemCode.order_id)
    .eq("status", "paid")
    .single();

  if (!order) {
    return NextResponse.json(
      { error: "Invalid order for code" },
      { status: 400 }
    );
  }

  // Mark code as used
  await admin
    .from("redeem_codes")
    .update({
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .eq("id", redeemCode.id);

  // Create entitlement
  await admin.from("entitlements").insert({
    user_id: user.id,
    quiz_id: redeemCode.quiz_id,
    order_id: order.id,
    attempts_allowed: 1,
    attempts_used: 0,
  });

  return NextResponse.json({
    message: "Code redeemed successfully",
    quiz_id: redeemCode.quiz_id,
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/codes/generate?order_id=xxx — Download codes CSV
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json(
      { error: "order_id required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify order belongs to user
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Get codes
  const { data: codes } = await admin
    .from("redeem_codes")
    .select("code, used_by, used_at")
    .eq("order_id", orderId)
    .order("created_at");

  if (!codes || codes.length === 0) {
    return NextResponse.json({ error: "No codes found" }, { status: 404 });
  }

  // Generate CSV
  const csv = [
    "Code,Status,Used At",
    ...codes.map(
      (c) =>
        `${c.code},${c.used_by ? "Used" : "Available"},${c.used_at || ""}`
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=codes-${orderId}.csv`,
    },
  });
}

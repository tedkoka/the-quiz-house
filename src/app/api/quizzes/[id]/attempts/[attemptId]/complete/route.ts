import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST — Complete an attempt, compute score server-side
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const { id: quizId, attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify attempt
  const { data: attempt } = await admin
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .eq("completed", false)
    .single();

  if (!attempt) {
    return NextResponse.json(
      { error: "Attempt not found or already completed" },
      { status: 404 }
    );
  }

  // Compute score server-side
  const { data: answers } = await admin
    .from("attempt_answers")
    .select("is_correct, time_taken_seconds")
    .eq("attempt_id", attemptId);

  const score = answers?.filter((a) => a.is_correct).length || 0;
  const totalTime = answers?.reduce(
    (sum, a) => sum + Number(a.time_taken_seconds),
    0
  ) || 0;

  // Update attempt
  await admin
    .from("attempts")
    .update({
      score,
      total_time_seconds: totalTime,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  // Increment attempts_used on entitlement
  await admin.rpc("increment_attempts_used", {
    p_entitlement_id: attempt.entitlement_id,
  }).then(({ error }) => {
    // Fallback if RPC doesn't exist
    if (error) {
      return admin
        .from("entitlements")
        .update({ attempts_used: attempt.attempts_used + 1 })
        .eq("id", attempt.entitlement_id);
    }
  });

  return NextResponse.json({ score, total_time_seconds: totalTime });
}

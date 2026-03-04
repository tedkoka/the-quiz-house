import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateResultsRecap } from "@/lib/ai";

// GET /api/recap/[attemptId] — Get AI recap for attempt
export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("completed", true)
    .single();

  if (!attempt) {
    return NextResponse.json(
      { error: "Attempt not found" },
      { status: 404 }
    );
  }

  const { data: quiz } = await admin
    .from("quizzes")
    .select("title")
    .eq("id", attempt.quiz_id)
    .single();

  const { count: totalQuestions } = await admin
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", attempt.quiz_id);

  // Get user rank
  const { data: rankData } = await admin.rpc("get_user_rank", {
    p_quiz_id: attempt.quiz_id,
    p_user_id: user.id,
  });

  try {
    const recap = await generateResultsRecap({
      quizTitle: quiz?.title || "Quiz",
      score: attempt.score,
      totalQuestions: totalQuestions || 0,
      totalTimeSeconds: Number(attempt.total_time_seconds),
      rank: rankData?.[0]?.rank,
    });

    return NextResponse.json({ recap });
  } catch (error) {
    console.error("AI recap error:", error);
    return NextResponse.json({ recap: null });
  }
}

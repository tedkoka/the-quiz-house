import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/quizzes/[id]/leaderboard
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params;
  const admin = createAdminClient();

  // Get top 50
  const { data: leaderboard, error } = await admin.rpc("get_leaderboard", {
    p_quiz_id: quizId,
    p_limit: 50,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }

  // Check if user is logged in for their rank
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRank = null;
  if (user) {
    const { data } = await admin.rpc("get_user_rank", {
      p_quiz_id: quizId,
      p_user_id: user.id,
    });
    if (data && data.length > 0) {
      userRank = data[0];
    }
  }

  return NextResponse.json({ leaderboard: leaderboard || [], userRank });
}

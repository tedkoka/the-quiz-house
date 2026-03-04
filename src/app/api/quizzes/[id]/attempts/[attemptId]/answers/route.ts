import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST — Submit an answer for a question
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

  // Verify attempt belongs to user and is not completed
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

  const body = await request.json();
  const { question_id, selected_option_index, time_taken_seconds } = body;

  // Validate: get quiz time limit
  const { data: quiz } = await admin
    .from("quizzes")
    .select("time_per_question_seconds")
    .eq("id", quizId)
    .single();

  // Server-side timer validation: allow small buffer for latency
  const maxTime = (quiz?.time_per_question_seconds || 30) + 2;
  const validatedTime = Math.min(
    Math.max(0, time_taken_seconds),
    maxTime
  );

  // Check if answer already exists for this question
  const { data: existingAnswer } = await admin
    .from("attempt_answers")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("question_id", question_id)
    .single();

  if (existingAnswer) {
    return NextResponse.json(
      { error: "Already answered this question" },
      { status: 409 }
    );
  }

  // Get correct answer
  const { data: question } = await admin
    .from("questions")
    .select("correct_option_index")
    .eq("id", question_id)
    .eq("quiz_id", quizId)
    .single();

  if (!question) {
    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 }
    );
  }

  const isCorrect =
    selected_option_index >= 0 &&
    selected_option_index === question.correct_option_index;

  // Insert answer
  await admin.from("attempt_answers").insert({
    attempt_id: attemptId,
    question_id,
    selected_option_index,
    is_correct: isCorrect,
    time_taken_seconds: validatedTime,
  });

  return NextResponse.json({ is_correct: isCorrect });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/quizzes/[id]/attempts — Start a new attempt
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get quiz
  const { data: quiz } = await admin
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("published", true)
    .single();

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Check entitlement (free quizzes auto-create entitlement)
  if (quiz.price_cents === 0) {
    // For free quizzes, ensure an entitlement exists
    const { data: existing } = await admin
      .from("entitlements")
      .select("*")
      .eq("user_id", user.id)
      .eq("quiz_id", quizId)
      .single();

    if (!existing) {
      // Create a free order and entitlement
      const { data: order } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          amount_cents: 0,
          quantity: 1,
          order_type: "b2c",
          status: "paid",
        })
        .select()
        .single();

      if (order) {
        await admin.from("entitlements").insert({
          user_id: user.id,
          quiz_id: quizId,
          order_id: order.id,
          attempts_allowed: 999, // unlimited for free quizzes
          attempts_used: 0,
        });
      }
    }
  }

  // Get entitlement
  const { data: entitlement } = await admin
    .from("entitlements")
    .select("*")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .single();

  if (!entitlement) {
    return NextResponse.json(
      { error: "No entitlement. Please purchase access." },
      { status: 403 }
    );
  }

  if (entitlement.attempts_used >= entitlement.attempts_allowed) {
    return NextResponse.json(
      { error: "No attempts remaining" },
      { status: 403 }
    );
  }

  // Create attempt
  const { data: attempt, error: attemptError } = await admin
    .from("attempts")
    .insert({
      user_id: user.id,
      quiz_id: quizId,
      entitlement_id: entitlement.id,
      score: 0,
      total_time_seconds: 0,
      completed: false,
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json(
      { error: "Failed to create attempt" },
      { status: 500 }
    );
  }

  // Get questions (without correct answers)
  const { data: questions } = await admin
    .from("questions")
    .select("id, quiz_id, question_text, options, order_index")
    .eq("quiz_id", quizId)
    .order("order_index");

  return NextResponse.json({
    attempt_id: attempt.id,
    questions: questions || [],
    time_per_question_seconds: quiz.time_per_question_seconds,
  });
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecapSection } from "@/components/RecapSection";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt) return notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single();

  const { data: answers } = await supabase
    .from("attempt_answers")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("created_at");

  const { count: totalQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", id);

  const scorePercent =
    totalQuestions && totalQuestions > 0
      ? Math.round((attempt.score / totalQuestions) * 100)
      : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-2">Your Results</h1>
      <p className="text-[var(--muted-foreground)] mb-8">{quiz?.title}</p>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 mb-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-extrabold text-[var(--primary)]">
              {attempt.score}/{totalQuestions}
            </div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">Score</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-[var(--accent)]">
              {scorePercent}%
            </div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">Accuracy</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold">
              {Number(attempt.total_time_seconds).toFixed(1)}s
            </div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">Total Time</div>
          </div>
        </div>
      </div>

      {/* AI Recap */}
      <RecapSection attemptId={attemptId} />

      {/* Answer breakdown */}
      {answers && answers.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
          <h2 className="font-bold mb-4">Answer Breakdown</h2>
          <div className="space-y-2">
            {answers.map((answer, idx) => (
              <div
                key={answer.id}
                className={`flex justify-between items-center p-3 rounded-xl font-medium ${
                  answer.is_correct
                    ? "bg-[var(--success-muted)] text-[var(--success)]"
                    : "bg-[var(--danger-muted)] text-[var(--danger)]"
                }`}
              >
                <span>
                  Question {idx + 1}:{" "}
                  {answer.is_correct ? "Correct" : "Incorrect"}
                </span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {Number(answer.time_taken_seconds).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Link
          href={`/leaderboard/${id}`}
          className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          View Leaderboard
        </Link>
        <Link
          href={`/quiz/${id}`}
          className="border-2 border-[var(--border)] px-6 py-3 rounded-2xl font-bold hover:border-[var(--primary)] transition-all duration-200"
        >
          Back to Room
        </Link>
      </div>
    </div>
  );
}

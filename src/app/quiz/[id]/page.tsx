import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (!quiz) return notFound();

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasEntitlement = false;
  if (user) {
    const { data: entitlement } = await supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", user.id)
      .eq("quiz_id", id)
      .gt("attempts_allowed", 0)
      .single();
    if (entitlement && entitlement.attempts_used < entitlement.attempts_allowed) {
      hasEntitlement = true;
    }
  }

  const isFree = quiz.price_cents === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/quiz/catalog" className="text-[var(--primary)] text-sm font-medium hover:underline">
          &larr; Back to Rooms
        </Link>
      </div>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold bg-[var(--badge-muted)] text-[var(--primary)] px-3 py-1 rounded-full">
            {quiz.category}
          </span>
          <span className="text-lg font-bold text-[var(--accent)]">
            {isFree ? "Free" : `R${(quiz.price_cents / 100).toFixed(2)}`}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold mt-4">{quiz.title}</h1>
        <p className="text-[var(--muted-foreground)] mt-4 leading-relaxed">{quiz.description}</p>
        <div className="mt-6 flex gap-6 text-sm text-[var(--muted-foreground)]">
          <span>{questionCount ?? 0} questions</span>
          <span>{quiz.time_per_question_seconds}s per question</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          {user ? (
            hasEntitlement || isFree ? (
              <Link
                href={`/quiz/${id}/play`}
                className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Enter Room
              </Link>
            ) : (
              <Link
                href={`/dashboard/orders?quiz_id=${id}`}
                className="bg-[var(--accent)] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Access
              </Link>
            )
          ) : (
            <Link
              href="/auth/login"
              className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Login to Enter
            </Link>
          )}
          <Link
            href={`/leaderboard/${id}`}
            className="border-2 border-[var(--border)] px-8 py-3 rounded-2xl font-bold hover:border-[var(--primary)] transition-all duration-200"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

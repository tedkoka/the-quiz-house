import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Quiz Rooms</h1>
      <p className="text-[var(--muted-foreground)] mb-8">Pick a room and show them what you&apos;ve got.</p>
      {!quizzes?.length ? (
        <p className="text-[var(--muted-foreground)]">No rooms open yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/quiz/${quiz.id}`}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--primary)] hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-[var(--badge-muted)] text-[var(--primary)] px-3 py-1 rounded-full">
                  {quiz.category}
                </span>
                <span className="text-sm font-bold text-[var(--accent)]">
                  {quiz.price_cents === 0
                    ? "Free"
                    : `R${(quiz.price_cents / 100).toFixed(2)}`}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-3 group-hover:text-[var(--primary)] transition-colors">
                {quiz.title}
              </h2>
              <p className="text-[var(--muted-foreground)] mt-2 text-sm line-clamp-2">
                {quiz.description}
              </p>
              <div className="mt-4 text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                <span>{quiz.time_per_question_seconds}s per question</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

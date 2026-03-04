import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Quiz } from "@/types/database";

export const dynamic = "force-dynamic";

interface QuizWithCount extends Quiz {
  questions: { count: number }[];
}

export default async function AdminQuizzesPage() {
  const supabase = await createClient();

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("*, questions(count)")
    .order("created_at", { ascending: false })
    .returns<QuizWithCount[]>();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold">Manage Rooms</h1>
        <Link
          href="/admin/quizzes/new"
          className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          + New Room
        </Link>
      </div>

      {error && (
        <p className="text-[var(--danger)] mb-4 font-medium">Failed to load rooms: {error.message}</p>
      )}

      {!quizzes?.length ? (
        <p className="text-[var(--muted-foreground)]">No rooms yet. Create your first room to get started.</p>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)] text-left text-sm text-[var(--muted-foreground)]">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Questions</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => {
                const questionCount = quiz.questions?.[0]?.count ?? 0;

                return (
                  <tr
                    key={quiz.id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)] transition"
                  >
                    <td className="p-4 font-medium">{quiz.title}</td>
                    <td className="p-4">
                      <span className="text-xs font-semibold bg-[var(--badge-muted)] text-[var(--primary)] px-3 py-1 rounded-full">
                        {quiz.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--muted-foreground)]">
                      {questionCount}
                    </td>
                    <td className="p-4 text-sm">
                      {quiz.price_cents === 0
                        ? "Free"
                        : `R${(quiz.price_cents / 100).toFixed(2)}`}
                    </td>
                    <td className="p-4">
                      {quiz.published ? (
                        <span className="text-xs font-semibold bg-[var(--success-muted)] text-[var(--success)] px-3 py-1 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-[var(--accent-muted)] text-[var(--accent)] px-3 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/quizzes/${quiz.id}/edit`}
                        className="text-[var(--primary)] hover:underline text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

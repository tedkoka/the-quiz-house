import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("*, quizzes(title)")
    .eq("user_id", user.id);

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*, quizzes(title)")
    .eq("user_id", user.id)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(10);

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Dashboard</h1>
      <p className="text-[var(--muted-foreground)] mb-8">
        Welcome back, {profile?.display_name}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <div className="text-3xl font-extrabold text-[var(--primary)]">
            {entitlements?.length || 0}
          </div>
          <div className="text-sm text-[var(--muted-foreground)] mt-1">Rooms Unlocked</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <div className="text-3xl font-extrabold text-[var(--accent)]">
            {attempts?.length || 0}
          </div>
          <div className="text-sm text-[var(--muted-foreground)] mt-1">Rooms Completed</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <div className="text-3xl font-extrabold">
            {orders?.length || 0}
          </div>
          <div className="text-sm text-[var(--muted-foreground)] mt-1">Orders</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href="/quiz/catalog"
          className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          Browse Rooms
        </Link>
        <Link
          href="/dashboard/redeem"
          className="border-2 border-[var(--border)] px-6 py-2 rounded-2xl font-medium hover:border-[var(--primary)] transition-all duration-200"
        >
          Redeem Code
        </Link>
        <Link
          href="/dashboard/orders"
          className="border-2 border-[var(--border)] px-6 py-2 rounded-2xl font-medium hover:border-[var(--primary)] transition-all duration-200"
        >
          My Orders
        </Link>
        <Link
          href="/dashboard/codes"
          className="border-2 border-[var(--border)] px-6 py-2 rounded-2xl font-medium hover:border-[var(--primary)] transition-all duration-200"
        >
          My Codes
        </Link>
      </div>

      {/* Recent attempts */}
      {attempts && attempts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Attempts</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold">Room</th>
                  <th className="text-right p-4 text-sm font-semibold">Score</th>
                  <th className="text-right p-4 text-sm font-semibold">Time</th>
                  <th className="text-right p-4 text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="p-4">
                      <Link
                        href={`/quiz/${attempt.quiz_id}/results/${attempt.id}`}
                        className="text-[var(--primary)] font-medium hover:underline"
                      >
                        {(attempt as Record<string, unknown>).quizzes
                          ? ((attempt as Record<string, unknown>).quizzes as { title: string }).title
                          : "Quiz"}
                      </Link>
                    </td>
                    <td className="p-4 text-right font-bold">
                      {attempt.score}
                    </td>
                    <td className="p-4 text-right text-sm text-[var(--muted-foreground)]">
                      {Number(attempt.total_time_seconds).toFixed(1)}s
                    </td>
                    <td className="p-4 text-right text-sm text-[var(--muted-foreground)]">
                      {new Date(attempt.completed_at!).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entitlements */}
      {entitlements && entitlements.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">My Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entitlements.map((ent) => (
              <div key={ent.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-[var(--shadow-card)]">
                <div className="font-bold">
                  {(ent as Record<string, unknown>).quizzes
                    ? ((ent as Record<string, unknown>).quizzes as { title: string }).title
                    : "Quiz"}
                </div>
                <div className="text-sm text-[var(--muted-foreground)] mt-1">
                  {ent.attempts_used}/{ent.attempts_allowed} attempts used
                </div>
                {ent.attempts_used < ent.attempts_allowed && (
                  <Link
                    href={`/quiz/${ent.quiz_id}/play`}
                    className="text-[var(--primary)] font-medium text-sm mt-2 inline-block hover:underline"
                  >
                    Enter Room &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeaderboardEntry } from "@/types/database";

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const [quizId, setQuizId] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setQuizId(p.quizId));
  }, [params]);

  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/quizzes/${quizId}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.leaderboard || []);
        setUserRank(data.userRank || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-bold text-[var(--primary)]">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href={`/quiz/${quizId}`} className="text-[var(--primary)] text-sm font-medium hover:underline">
          &larr; Back to Room
        </Link>
      </div>
      <h1 className="text-3xl font-extrabold mb-8">Leaderboard</h1>

      {userRank && (
        <div className="border-2 border-[var(--primary)] rounded-2xl p-4 mb-6 bg-[var(--primary-muted)] shadow-[var(--shadow-card)]">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-[var(--primary)]">
                Your Rank: #{userRank.rank}
              </span>
              <span className="ml-4 text-[var(--muted-foreground)]">
                {userRank.display_name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold">{userRank.score} pts</span>
              <span className="ml-4 text-sm text-[var(--muted-foreground)]">
                {Number(userRank.total_time_seconds).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">
          No one has entered this room yet. Be the first!
        </p>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">Rank</th>
                <th className="text-left p-4 text-sm font-semibold">Player</th>
                <th className="text-right p-4 text-sm font-semibold">Score</th>
                <th className="text-right p-4 text-sm font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.rank}
                  className="border-t border-[var(--border)]"
                >
                  <td className="p-4">
                    {entry.rank <= 3 ? (
                      <span className="text-lg">
                        {entry.rank === 1
                          ? "\u{1F947}"
                          : entry.rank === 2
                            ? "\u{1F948}"
                            : "\u{1F949}"}
                      </span>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">#{entry.rank}</span>
                    )}
                  </td>
                  <td className="p-4 font-medium">{entry.display_name}</td>
                  <td className="p-4 text-right font-bold">{entry.score}</td>
                  <td className="p-4 text-right text-sm text-[var(--muted-foreground)]">
                    {Number(entry.total_time_seconds).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

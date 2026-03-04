"use client";

import { useEffect, useState } from "react";

export function RecapSection({ attemptId }: { attemptId: string }) {
  const [recap, setRecap] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recap/${attemptId}`)
      .then((res) => res.json())
      .then((data) => {
        setRecap(data.recap || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="border border-[var(--border)] rounded-2xl p-6 mb-8 animate-pulse shadow-[var(--shadow-card)]">
        <div className="h-4 bg-[var(--progress-track)] rounded-full w-3/4 mb-2" />
        <div className="h-4 bg-[var(--progress-track)] rounded-full w-1/2" />
      </div>
    );
  }

  if (!recap) return null;

  return (
    <div className="border border-[var(--border)] rounded-2xl p-6 mb-8 bg-[var(--primary-muted)] shadow-[var(--shadow-card)]">
      <h2 className="font-extrabold mb-3 text-[var(--primary)]">
        The Quiz House Says...
      </h2>
      <div className="whitespace-pre-line text-sm leading-relaxed">{recap}</div>
    </div>
  );
}

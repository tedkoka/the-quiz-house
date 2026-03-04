"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/codes/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to redeem code");
      setLoading(false);
      return;
    }

    setSuccess("Code redeemed! You now have access to the room.");
    setCode("");
    setLoading(false);

    // Redirect to the quiz after a short delay
    setTimeout(() => {
      router.push(`/quiz/${data.quiz_id}`);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-extrabold mb-4">Redeem Code</h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          Enter your redeem code to unlock a room.
        </p>

        <form onSubmit={handleRedeem} className="space-y-4">
          {error && (
            <div className="bg-[var(--danger-muted)] text-[var(--danger)] p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-[var(--success-muted)] text-[var(--success)] p-3 rounded-xl text-sm font-medium">
              {success}
            </div>
          )}
          <input
            type="text"
            placeholder="Enter your code (e.g., ABCD1234EFGH)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            className="border border-[var(--input)] rounded-2xl p-3 w-full bg-transparent text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            maxLength={12}
          />
          <button
            type="submit"
            disabled={loading || code.length === 0}
            className="w-full bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white p-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Redeeming..." : "Redeem Code"}
          </button>
        </form>
      </div>
    </div>
  );
}

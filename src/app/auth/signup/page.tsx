"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Unable to connect to Supabase. Please check your internet connection and try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-extrabold mb-8 text-center">Join The Quiz House</h1>
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {error && (
            <div className="bg-[var(--danger-muted)] text-[var(--danger)] p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="border border-[var(--input)] rounded-2xl p-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-[var(--input)] rounded-2xl p-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border border-[var(--input)] rounded-2xl p-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white p-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-6 text-center text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[var(--primary)] font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

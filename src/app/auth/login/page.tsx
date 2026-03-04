"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-3xl font-extrabold mb-8 text-center">Welcome Back</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-[var(--danger-muted)] text-[var(--danger)] p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-[var(--input)] rounded-2xl p-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white p-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-6 text-center text-[var(--muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[var(--primary)] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

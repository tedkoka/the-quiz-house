"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import type { Profile } from "@/types/database";

export function NavBar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabaseRef = useRef<ReturnType<
    typeof import("@/lib/supabase/client").createClient
  > | null>(null);

  useEffect(() => {
    // Only create Supabase client on the browser
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabaseRef.current = supabase;
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()
            .then(({ data }) => setProfile(data));
        }
      });
    });
  }, []);

  const handleLogout = async () => {
    if (supabaseRef.current) {
      await supabaseRef.current.auth.signOut();
    }
    window.location.href = "/";
  };

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] bg-clip-text text-transparent">
          The Quiz House
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/quiz/catalog" className="font-medium hover:text-[var(--primary)] transition">
            Quizzes
          </Link>
          {profile ? (
            <>
              <Link href="/dashboard" className="font-medium hover:text-[var(--primary)] transition">
                Dashboard
              </Link>
              {profile.role === "admin" && (
                <Link
                  href="/admin/quizzes"
                  className="font-medium hover:text-[var(--primary)] transition"
                >
                  Admin
                </Link>
              )}
              <span className="text-sm text-[var(--muted-foreground)]">
                {profile.display_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-[var(--danger)] hover:opacity-80 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="font-medium hover:text-[var(--primary)] transition"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-5 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 space-y-3">
          <Link href="/quiz/catalog" onClick={() => setMenuOpen(false)} className="block font-medium hover:text-[var(--primary)] transition">
            Quizzes
          </Link>
          {profile ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block font-medium hover:text-[var(--primary)] transition">
                Dashboard
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin/quizzes" onClick={() => setMenuOpen(false)} className="block font-medium hover:text-[var(--primary)] transition">
                  Admin
                </Link>
              )}
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">{profile.display_name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-[var(--danger)] hover:opacity-80 transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center border border-[var(--border)] px-4 py-2 rounded-2xl font-medium hover:border-[var(--primary)] transition"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-4 py-2 rounded-2xl font-bold transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

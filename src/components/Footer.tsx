import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-extrabold bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] bg-clip-text text-transparent">
            The Quiz House
          </Link>
          <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
            <Link href="/quiz/catalog" className="hover:text-[var(--primary)] transition">
              Rooms
            </Link>
            <Link href="/auth/signup" className="hover:text-[var(--primary)] transition">
              Sign Up
            </Link>
            <Link href="/auth/login" className="hover:text-[var(--primary)] transition">
              Login
            </Link>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            &copy; {new Date().getFullYear()} The Quiz House
          </p>
        </div>
      </div>
    </footer>
  );
}

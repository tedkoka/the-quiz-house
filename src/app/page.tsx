import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 className="text-5xl md:text-6xl font-extrabold text-center leading-tight">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] bg-clip-text text-transparent">
          The Quiz House
        </span>
      </h1>
      <p className="text-xl text-[var(--muted-foreground)] text-center max-w-2xl leading-relaxed">
        Step into a room, take on curated quizzes, climb the leaderboard, and
        walk out a champion.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/quiz/catalog"
          className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-8 py-3 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          Enter a Room
        </Link>
        <Link
          href="/auth/signup"
          className="border-2 border-[var(--primary)] text-[var(--primary)] px-8 py-3 rounded-2xl text-lg font-bold hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
        >
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "The Quiz House",
  description: "Step into a room, take on curated quizzes, climb the leaderboard, and walk out a champion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

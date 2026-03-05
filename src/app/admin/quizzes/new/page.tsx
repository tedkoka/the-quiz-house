"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface QuizFormData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  price_rands: string;
  time_per_question_seconds: string;
}

export default function NewQuizPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<QuizFormData>({
    title: "",
    description: "",
    category: "",
    difficulty: "medium",
    price_rands: "0",
    time_per_question_seconds: "30",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const priceRands = parseFloat(form.price_rands);
    if (isNaN(priceRands) || priceRands < 0) {
      setError("Price must be a valid non-negative number.");
      setSaving(false);
      return;
    }

    const timePerQuestion = parseInt(form.time_per_question_seconds, 10);
    if (isNaN(timePerQuestion) || timePerQuestion < 1) {
      setError("Time per question must be at least 1 second.");
      setSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        difficulty: form.difficulty,
        price_cents: Math.round(priceRands * 100),
        time_per_question_seconds: timePerQuestion,
        published: false,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(`/admin/quizzes/${data.id}/edit`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">Create New Room</h1>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[var(--danger-muted)] text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="e.g. South African History"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-y"
              placeholder="A brief description of what this room covers"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              required
              value={form.category}
              onChange={handleChange}
              className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="e.g. History, Science, General Knowledge"
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              required
              value={form.difficulty}
              onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
              className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price_rands"
                className="block text-sm font-medium mb-1"
              >
                Price (Rands)
              </label>
              <input
                id="price_rands"
                name="price_rands"
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price_rands}
                onChange={handleChange}
                className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                placeholder="0.00"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Set to 0 for a free room
              </p>
            </div>

            <div>
              <label
                htmlFor="time_per_question_seconds"
                className="block text-sm font-medium mb-1"
              >
                Time per Question (seconds)
              </label>
              <input
                id="time_per_question_seconds"
                name="time_per_question_seconds"
                type="number"
                required
                min="1"
                value={form.time_per_question_seconds}
                onChange={handleChange}
                className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Room"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/quizzes")}
              className="border-2 border-[var(--border)] px-8 py-3 rounded-2xl font-bold hover:border-[var(--primary)] transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

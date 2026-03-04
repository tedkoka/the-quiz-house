"use client";

import { createClient } from "@/lib/supabase/client";
import type { Quiz, Question } from "@/types/database";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuizFormData {
  title: string;
  description: string;
  category: string;
  price_rands: string;
  time_per_question_seconds: string;
  published: boolean;
}

interface QuestionFormData {
  id: string | null; // null = new, unsaved question
  question_text: string;
  options: [string, string, string, string];
  correct_option_index: number;
  order_index: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toQuizForm(quiz: Quiz): QuizFormData {
  return {
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    price_rands: (quiz.price_cents / 100).toFixed(2),
    time_per_question_seconds: String(quiz.time_per_question_seconds),
    published: quiz.published,
  };
}

function toQuestionForm(q: Question): QuestionFormData {
  const opts = q.options as string[];
  return {
    id: q.id,
    question_text: q.question_text,
    options: [opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""],
    correct_option_index: q.correct_option_index,
    order_index: q.order_index,
  };
}

function emptyQuestion(orderIndex: number): QuestionFormData {
  return {
    id: null,
    question_text: "",
    options: ["", "", "", ""],
    correct_option_index: 0,
    order_index: orderIndex,
  };
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [quizForm, setQuizForm] = useState<QuizFormData | null>(null);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ---- Load quiz + questions ---- */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: quiz, error: quizErr } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single<Quiz>();

    if (quizErr || !quiz) {
      setError(quizErr?.message ?? "Quiz not found.");
      setLoading(false);
      return;
    }

    setQuizForm(toQuizForm(quiz));

    const { data: qs, error: qsErr } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", id)
      .order("order_index", { ascending: true })
      .returns<Question[]>();

    if (qsErr) {
      setError(qsErr.message);
    } else {
      setQuestions((qs ?? []).map(toQuestionForm));
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---- Flash success message ---- */

  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  /* ---- Quiz field handlers ---- */

  function handleQuizChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    if (!quizForm) return;
    setQuizForm({ ...quizForm, [e.target.name]: e.target.value });
  }

  function togglePublished() {
    if (!quizForm) return;
    setQuizForm({ ...quizForm, published: !quizForm.published });
  }

  async function saveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!quizForm) return;
    setError(null);
    setSavingQuiz(true);

    const priceRands = parseFloat(quizForm.price_rands);
    if (isNaN(priceRands) || priceRands < 0) {
      setError("Price must be a valid non-negative number.");
      setSavingQuiz(false);
      return;
    }

    const timePerQ = parseInt(quizForm.time_per_question_seconds, 10);
    if (isNaN(timePerQ) || timePerQ < 1) {
      setError("Time per question must be at least 1 second.");
      setSavingQuiz(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from("quizzes")
      .update({
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        category: quizForm.category.trim(),
        price_cents: Math.round(priceRands * 100),
        time_per_question_seconds: timePerQ,
        published: quizForm.published,
      })
      .eq("id", id);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      flashSuccess("Quiz details saved.");
    }

    setSavingQuiz(false);
  }

  /* ---- Question handlers ---- */

  function updateQuestion(
    index: number,
    patch: Partial<QuestionFormData>
  ) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[optIndex] = value;
        return { ...q, options: opts };
      })
    );
  }

  function addQuestion() {
    const nextOrder =
      questions.length > 0
        ? Math.max(...questions.map((q) => q.order_index)) + 1
        : 0;
    setQuestions((prev) => [...prev, emptyQuestion(nextOrder)]);
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    )
      return;

    setQuestions((prev) => {
      const updated = [...prev];
      const swapIdx = direction === "up" ? index - 1 : index + 1;

      const tempOrder = updated[index].order_index;
      updated[index] = { ...updated[index], order_index: updated[swapIdx].order_index };
      updated[swapIdx] = { ...updated[swapIdx], order_index: tempOrder };

      [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];

      return updated;
    });
  }

  async function deleteQuestion(index: number) {
    const q = questions[index];
    if (q.id) {
      const { error: delErr } = await supabase
        .from("questions")
        .delete()
        .eq("id", q.id);
      if (delErr) {
        setError(delErr.message);
        return;
      }
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    flashSuccess("Question deleted.");
  }

  async function saveAllQuestions() {
    setError(null);
    setSavingQuestions(true);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} is missing question text.`);
        setSavingQuestions(false);
        return;
      }

      if (q.options.some((o) => !o.trim())) {
        setError(`Question ${i + 1} has empty options. All 4 options are required.`);
        setSavingQuestions(false);
        return;
      }
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const payload = {
        quiz_id: id,
        question_text: q.question_text.trim(),
        options: q.options.map((o) => o.trim()),
        correct_option_index: q.correct_option_index,
        order_index: q.order_index,
      };

      if (q.id) {
        const { error: upErr } = await supabase
          .from("questions")
          .update(payload)
          .eq("id", q.id);
        if (upErr) {
          setError(`Failed to update question ${i + 1}: ${upErr.message}`);
          setSavingQuestions(false);
          return;
        }
      } else {
        const { data, error: insErr } = await supabase
          .from("questions")
          .insert(payload)
          .select("id")
          .single();
        if (insErr) {
          setError(`Failed to insert question ${i + 1}: ${insErr.message}`);
          setSavingQuestions(false);
          return;
        }
        // Update the local id so subsequent saves are updates
        setQuestions((prev) =>
          prev.map((pq, pi) => (pi === i ? { ...pq, id: data.id } : pq))
        );
      }
    }

    flashSuccess("All questions saved.");
    setSavingQuestions(false);
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] font-bold">Loading room...</p>
      </div>
    );
  }

  if (!quizForm) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-[var(--danger)] mb-4 font-medium">{error ?? "Room not found."}</p>
        <Link href="/admin/quizzes" className="text-[var(--primary)] font-medium hover:underline">
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/quizzes"
            className="text-[var(--primary)] text-sm font-medium hover:underline"
          >
            &larr; Back to Rooms
          </Link>
          <h1 className="text-3xl font-extrabold mt-2">Edit Room</h1>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="bg-[var(--danger-muted)] text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium mb-6">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-[var(--success-muted)] text-[var(--success)] px-4 py-3 rounded-xl text-sm font-medium mb-6">
          {successMsg}
        </div>
      )}

      {/* ---- Quiz Details Section ---- */}
      <form
        onSubmit={saveQuiz}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-10 space-y-5 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-xl font-bold">Room Details</h2>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={quizForm.title}
            onChange={handleQuizChange}
            className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
            value={quizForm.description}
            onChange={handleQuizChange}
            className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-y"
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
            value={quizForm.category}
            onChange={handleQuizChange}
            className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
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
              value={quizForm.price_rands}
              onChange={handleQuizChange}
              className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
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
              value={quizForm.time_per_question_seconds}
              onChange={handleQuizChange}
              className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={quizForm.published}
            onClick={togglePublished}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              quizForm.published ? "bg-[var(--success)]" : "bg-[var(--progress-track)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                quizForm.published ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium">
            {quizForm.published ? "Published" : "Draft"}
          </span>
        </div>

        <button
          type="submit"
          disabled={savingQuiz}
          className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
        >
          {savingQuiz ? "Saving..." : "Save Room Details"}
        </button>
      </form>

      {/* ---- Questions Section ---- */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            Questions ({questions.length})
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="border-2 border-[var(--primary)] text-[var(--primary)] px-4 py-1.5 rounded-2xl text-sm font-bold hover:bg-[var(--primary)] hover:text-white transition-all duration-200"
          >
            + Add Question
          </button>
        </div>

        {questions.length === 0 && (
          <p className="text-[var(--muted-foreground)] text-sm">
            No questions yet. Click &quot;+ Add Question&quot; to start building
            your quiz.
          </p>
        )}

        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div
              key={q.id ?? `new-${qIdx}`}
              className="border border-[var(--border)] rounded-2xl p-5 space-y-4 bg-[var(--muted)]"
            >
              {/* Question header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                  Question {qIdx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIdx, "up")}
                    disabled={qIdx === 0}
                    className="text-xs border border-[var(--border)] rounded-xl px-2 py-1 hover:bg-[var(--badge-muted)] disabled:opacity-30 transition"
                    title="Move up"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIdx, "down")}
                    disabled={qIdx === questions.length - 1}
                    className="text-xs border border-[var(--border)] rounded-xl px-2 py-1 hover:bg-[var(--badge-muted)] disabled:opacity-30 transition"
                    title="Move down"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(qIdx)}
                    className="text-xs border border-[var(--danger)] text-[var(--danger)] rounded-xl px-2 py-1 hover:bg-[var(--danger-muted)] transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  value={q.question_text}
                  onChange={(e) =>
                    updateQuestion(qIdx, { question_text: e.target.value })
                  }
                  className="w-full border border-[var(--input)] rounded-2xl px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-y"
                  placeholder="Enter your question..."
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Options (select the correct answer)
                </label>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(qIdx, { correct_option_index: optIdx })
                      }
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                        q.correct_option_index === optIdx
                          ? "border-[var(--success)] bg-[var(--success)]"
                          : "border-[var(--border)] hover:border-[var(--success)]"
                      }`}
                      title={`Mark option ${optIdx + 1} as correct`}
                    >
                      {q.correct_option_index === optIdx && (
                        <span className="text-white text-xs font-bold">
                          &#10003;
                        </span>
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        updateOption(qIdx, optIdx, e.target.value)
                      }
                      className="flex-1 border border-[var(--input)] rounded-2xl px-3 py-1.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      placeholder={`Option ${optIdx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {questions.length > 0 && (
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={saveAllQuestions}
              disabled={savingQuestions}
              className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {savingQuestions ? "Saving Questions..." : "Save All Questions"}
            </button>
            <button
              type="button"
              onClick={addQuestion}
              className="border-2 border-[var(--border)] px-6 py-2 rounded-2xl font-bold hover:border-[var(--primary)] transition-all duration-200"
            >
              + Add Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

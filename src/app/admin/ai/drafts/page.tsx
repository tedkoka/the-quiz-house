"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuizDraft, QuizDraftJson } from "@/types/database";

export default function AIDraftsPage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<QuizDraft[]>([]);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    const { data } = await supabase
      .from("quiz_drafts")
      .select("*")
      .order("created_at", { ascending: false });
    setDrafts((data as QuizDraft[]) || []);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/quizzes/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Generation failed");
      } else {
        setPrompt("");
        loadDrafts();
      }
    } catch {
      setError("Generation failed");
    }
    setGenerating(false);
  };

  const handleRunQA = async (draftId: string) => {
    try {
      const res = await fetch("/api/quizzes/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_id: draftId }),
      });
      if (res.ok) {
        loadDrafts();
      }
    } catch {
      alert("QA check failed");
    }
  };

  const handleImport = async (draft: QuizDraft) => {
    const quizJson = draft.quiz_json as QuizDraftJson;

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        title: quizJson.title,
        description: quizJson.description,
        category: quizJson.category,
        price_cents: quizJson.price_cents,
        time_per_question_seconds: quizJson.time_per_question_seconds,
        published: false,
      })
      .select()
      .single();

    if (error || !quiz) {
      alert("Failed to import room");
      return;
    }

    const questions = quizJson.questions.map((q, idx) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_option_index: q.correct_option_index,
      order_index: idx,
    }));

    await supabase.from("questions").insert(questions);

    await supabase
      .from("quiz_drafts")
      .update({ status: "approved" })
      .eq("id", draft.id);

    loadDrafts();
    alert(`Room "${quizJson.title}" imported! Go to Admin > Rooms to publish.`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">AI Room Drafts</h1>

      {/* Generate form */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-bold mb-4">Generate New Draft</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="bg-[var(--danger-muted)] text-[var(--danger)] p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <textarea
            placeholder="Describe the room you want to generate. E.g., 'A 10-question quiz about South African geography for beginners'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={3}
            className="border border-[var(--input)] rounded-2xl p-3 w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={generating}
            className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Draft"}
          </button>
        </form>
      </div>

      {/* Drafts list */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Drafts</h2>
          {drafts.map((draft) => {
            const json = draft.quiz_json as QuizDraftJson;
            return (
              <div key={draft.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-card)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{json.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {json.category} &middot; {json.questions?.length || 0}{" "}
                      questions &middot; R
                      {((json.price_cents || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      draft.status === "approved"
                        ? "bg-[var(--success-muted)] text-[var(--success)]"
                        : draft.status === "rejected"
                          ? "bg-[var(--danger-muted)] text-[var(--danger)]"
                          : "bg-[var(--accent-muted)] text-[var(--accent)]"
                    }`}
                  >
                    {draft.status}
                  </span>
                </div>

                <p className="text-sm text-[var(--muted-foreground)] mb-4">{json.description}</p>

                {/* QA Report */}
                {draft.qa_report && (
                  <div className="bg-[var(--muted)] rounded-2xl p-4 mb-4">
                    <div className="font-semibold text-sm mb-2">
                      QA Report:{" "}
                      <span
                        className={
                          (draft.qa_report as { overall_status: string })
                            .overall_status === "pass"
                            ? "text-[var(--success)]"
                            : "text-[var(--danger)]"
                        }
                      >
                        {(draft.qa_report as { overall_status: string }).overall_status.toUpperCase()}
                      </span>
                    </div>
                    {(
                      draft.qa_report as {
                        issues: {
                          severity: string;
                          message: string;
                          suggested_fix: string | null;
                        }[];
                      }
                    ).issues?.map((issue, idx) => (
                      <div key={idx} className="text-xs mb-1">
                        <span
                          className={`font-bold ${
                            issue.severity === "critical"
                              ? "text-[var(--danger)]"
                              : issue.severity === "warning"
                                ? "text-[var(--accent)]"
                                : "text-[var(--primary)]"
                          }`}
                        >
                          [{issue.severity}]
                        </span>{" "}
                        {issue.message}
                        {issue.suggested_fix && (
                          <span className="text-[var(--muted-foreground)]">
                            {" "}
                            &mdash; {issue.suggested_fix}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Questions preview */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-[var(--primary)] font-medium">
                    Preview Questions
                  </summary>
                  <div className="mt-2 space-y-2">
                    {json.questions?.map((q, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-[var(--muted)] rounded-xl p-3"
                      >
                        <div className="font-medium">
                          {idx + 1}. {q.question_text}
                        </div>
                        <div className="mt-1 text-[var(--muted-foreground)]">
                          {q.options.map((opt, oi) => (
                            <span
                              key={oi}
                              className={
                                oi === q.correct_option_index
                                  ? "text-[var(--success)] font-medium"
                                  : ""
                              }
                            >
                              {String.fromCharCode(65 + oi)}) {opt}
                              {oi < q.options.length - 1 ? " | " : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Actions */}
                <div className="flex gap-2">
                  {!draft.qa_report && (
                    <button
                      onClick={() => handleRunQA(draft.id)}
                      className="border-2 border-[var(--border)] px-4 py-2 rounded-2xl text-sm font-medium hover:border-[var(--primary)] transition-all duration-200"
                    >
                      Run QA Check
                    </button>
                  )}
                  {draft.status === "pending" && (
                    <button
                      onClick={() => handleImport(draft)}
                      className="bg-[var(--success)] text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Import as Room
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

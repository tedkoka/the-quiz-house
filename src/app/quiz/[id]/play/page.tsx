"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { QuestionPayload } from "@/types/database";

interface PlayState {
  attemptId: string;
  questions: QuestionPayload[];
  currentIndex: number;
  timeLeft: number;
  answers: { questionId: string; selectedIndex: number; timeTaken: number }[];
  finished: boolean;
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [quizId, setQuizId] = useState<string>("");
  const [state, setState] = useState<PlayState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    params.then((p) => setQuizId(p.id));
  }, [params]);

  // Start attempt
  useEffect(() => {
    if (!quizId) return;

    const startAttempt = async () => {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to start attempt");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTimePerQuestion(data.time_per_question_seconds);
        setState({
          attemptId: data.attempt_id,
          questions: data.questions,
          currentIndex: 0,
          timeLeft: data.time_per_question_seconds,
          answers: [],
          finished: false,
        });
        setLoading(false);
      } catch {
        setError("Failed to start quiz");
        setLoading(false);
      }
    };

    startAttempt();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (!state || state.finished) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev || prev.finished) return prev;
        if (prev.timeLeft <= 1) {
          // Auto-submit with no answer (index -1)
          handleAnswer(-1, timePerQuestion);
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state?.currentIndex, state?.finished]);

  const handleAnswer = useCallback(
    async (selectedIndex: number, timeTaken?: number) => {
      if (!state || state.finished || submitting) return;
      setSubmitting(true);

      const question = state.questions[state.currentIndex];
      const elapsed = timeTaken ?? timePerQuestion - state.timeLeft;

      // Submit answer to server
      try {
        await fetch(
          `/api/quizzes/${quizId}/attempts/${state.attemptId}/answers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question_id: question.id,
              selected_option_index: selectedIndex,
              time_taken_seconds: elapsed,
            }),
          }
        );
      } catch {
        // Continue even if submit fails
      }

      const newAnswers = [
        ...state.answers,
        { questionId: question.id, selectedIndex, timeTaken: elapsed },
      ];

      if (state.currentIndex >= state.questions.length - 1) {
        // Complete attempt
        try {
          const res = await fetch(
            `/api/quizzes/${quizId}/attempts/${state.attemptId}/complete`,
            { method: "POST" }
          );
          if (res.ok) {
            router.push(`/quiz/${quizId}/results/${state.attemptId}`);
            return;
          }
        } catch {
          // fallback
        }
        setState((prev) =>
          prev ? { ...prev, answers: newAnswers, finished: true } : prev
        );
      } else {
        setState((prev) =>
          prev
            ? {
                ...prev,
                currentIndex: prev.currentIndex + 1,
                timeLeft: timePerQuestion,
                answers: newAnswers,
              }
            : prev
        );
      }
      setSubmitting(false);
    },
    [state, quizId, timePerQuestion, submitting, router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl font-bold text-[var(--primary)]">Entering room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="text-[var(--danger)] text-xl font-bold mb-4">{error}</div>
        <button
          onClick={() => router.push(`/quiz/${quizId}`)}
          className="text-[var(--primary)] font-medium hover:underline"
        >
          Back to Room
        </button>
      </div>
    );
  }

  if (!state) return null;

  const question = state.questions[state.currentIndex];
  const progress =
    ((state.currentIndex + 1) / state.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-[var(--muted-foreground)] mb-2">
          <span className="font-medium">
            Question {state.currentIndex + 1} of {state.questions.length}
          </span>
          <span
            className={`font-bold ${state.timeLeft <= 5 ? "text-[var(--danger)]" : ""}`}
          >
            {state.timeLeft}s
          </span>
        </div>
        <div className="w-full bg-[var(--progress-track)] rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full bg-[var(--progress-track)] rounded-full h-1.5 mb-8">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${
            state.timeLeft <= 5 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
          }`}
          style={{
            width: `${(state.timeLeft / timePerQuestion) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-bold mb-6">{question.question_text}</h2>
        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={submitting}
              className="text-left border-2 border-[var(--border)] rounded-2xl p-4 hover:border-[var(--primary)] hover:bg-[var(--primary-muted)] hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--badge-muted)] text-[var(--primary)] font-bold mr-3 text-sm">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

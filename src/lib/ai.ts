import OpenAI from "openai";
import type { QuizDraftJson, QAReport } from "@/types/database";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuizDraft(prompt: string): Promise<QuizDraftJson> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a quiz content builder. Generate a quiz in strict JSON schema.
Rules:
- No adult content, no offensive material
- Questions must be unambiguous with exactly one correct answer
- Each question must have exactly 4 options
- correct_option_index is 0-based

Output JSON schema:
{
  "title": string,
  "description": string,
  "category": string,
  "price_cents": number,
  "time_per_question_seconds": number (10-60),
  "questions": [
    {
      "question_text": string,
      "options": [string, string, string, string],
      "correct_option_index": 0|1|2|3
    }
  ]
}`,
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content returned from AI");
  return JSON.parse(content) as QuizDraftJson;
}

export async function runQACheck(draft: QuizDraftJson): Promise<QAReport> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a quiz QA agent. Analyze the quiz JSON and produce a QA report.
Check for:
- Adult or offensive content (severity: critical)
- Ambiguous questions or multiple correct answers (severity: critical)
- Spelling/grammar issues (severity: warning)
- Missing or duplicate options (severity: critical)
- correct_option_index out of range (severity: critical)
- Questions that are too easy or too hard (severity: info)

Output JSON schema:
{
  "overall_status": "pass" | "fail",
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "question_index": number | null,
      "message": string,
      "suggested_fix": string | null
    }
  ]
}

Set overall_status to "fail" if any critical issues exist.`,
      },
      { role: "user", content: JSON.stringify(draft) },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content returned from AI");
  return JSON.parse(content) as QAReport;
}

export async function generateResultsRecap(params: {
  quizTitle: string;
  score: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  rank?: number;
}): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content: `You are The Quiz House host, the hype-master of quiz results.
Tone: classy, witty, hyped, with light South African slang. Keep it PG only.
Generate a short recap (5-8 lines) of the player's quiz performance.
End with 1-2 next quiz recommendations (just category suggestions).
Do NOT use any explicit or adult language.`,
      },
      {
        role: "user",
        content: `Quiz: "${params.quizTitle}"
Score: ${params.score}/${params.totalQuestions}
Time: ${params.totalTimeSeconds}s
${params.rank ? `Rank: #${params.rank}` : ""}`,
      },
    ],
  });

  return response.choices[0].message.content || "Great game! Check the leaderboard.";
}

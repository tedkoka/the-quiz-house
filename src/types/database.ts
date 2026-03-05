export type UserRole = "player" | "admin";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  price_cents: number;
  time_per_question_seconds: number;
  published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  order_index: number;
  created_at: string;
}

/** Question payload sent to client (no correct answer) */
export interface QuestionPayload {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  order_index: number;
}

export interface Order {
  id: string;
  user_id: string;
  quiz_id: string;
  amount_cents: number;
  quantity: number;
  order_type: "b2c" | "corporate";
  status: "pending" | "paid" | "cancelled";
  payfast_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string;
  quiz_id: string;
  order_id: string;
  attempts_allowed: number;
  attempts_used: number;
  created_at: string;
}

export interface RedeemCode {
  id: string;
  order_id: string;
  quiz_id: string;
  code: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  quiz_id: string;
  entitlement_id: string;
  score: number;
  total_time_seconds: number;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_index: number;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: string;
}

export interface LeaderboardEntry {
  display_name: string;
  rank: number;
  score: number;
  total_time_seconds: number;
}

export interface QuizDraft {
  id: string;
  quiz_json: QuizDraftJson;
  status: "pending" | "approved" | "rejected";
  qa_report: QAReport | null;
  created_by: string;
  created_at: string;
}

export interface QuizDraftJson {
  title: string;
  description: string;
  category: string;
  price_cents: number;
  time_per_question_seconds: number;
  questions: {
    question_text: string;
    options: string[];
    correct_option_index: number;
  }[];
}

export interface QAReport {
  overall_status: "pass" | "fail";
  issues: {
    severity: "critical" | "warning" | "info";
    question_index: number | null;
    message: string;
    suggested_fix: string | null;
  }[];
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runQACheck } from "@/lib/ai";

// POST /api/quizzes/qa — Run QA check on a draft
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { draft_id } = await request.json();
  if (!draft_id) {
    return NextResponse.json(
      { error: "draft_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: draft } = await admin
    .from("quiz_drafts")
    .select("*")
    .eq("id", draft_id)
    .single();

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  try {
    const report = await runQACheck(draft.quiz_json);

    // Update draft with QA report
    await admin
      .from("quiz_drafts")
      .update({ qa_report: report })
      .eq("id", draft_id);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("QA check error:", error);
    return NextResponse.json(
      { error: "QA check failed" },
      { status: 500 }
    );
  }
}

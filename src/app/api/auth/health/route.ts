import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return NextResponse.json({
        status: "ok",
        message: "Supabase is reachable and responding.",
        supabaseUrl: url,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: `Supabase responded with HTTP ${res.status}. Check your API keys.`,
        supabaseUrl: url,
      },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Cannot reach Supabase. Your project may be paused. Visit https://supabase.com/dashboard to check your project status and unpause it if needed.",
        supabaseUrl: url,
      },
      { status: 503 }
    );
  }
}

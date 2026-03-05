import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Verify Supabase env vars are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      // Detect network-level failures returned by the Supabase SDK
      const msg = error.message.toLowerCase();
      if (
        msg.includes("fetch") ||
        msg.includes("econnrefused") ||
        msg.includes("enotfound") ||
        msg.includes("network")
      ) {
        return NextResponse.json(
          {
            error:
              "Unable to reach Supabase. This environment may not have outbound network access. Please try running the app locally (npm run dev) or check that your Supabase project is active at https://supabase.com/dashboard.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    // Provide a helpful message for network-level failures
    if (
      message.includes("fetch") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("network")
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to reach Supabase. Your Supabase project may be paused (free-tier projects pause after inactivity). Please log in to your Supabase dashboard at https://supabase.com/dashboard and check that your project is active.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

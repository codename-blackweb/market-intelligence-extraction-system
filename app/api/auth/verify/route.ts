import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAuthConfigured, verifyEmailOtp } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase auth is not configured." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      token?: string;
      type?: "magiclink" | "recovery" | "signup";
    };

    if (!body.email || !body.token || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing verification payload." },
        { status: 400 }
      );
    }

    const session = await verifyEmailOtp({
      email: body.email.trim().toLowerCase(),
      token: body.token.trim(),
      type: body.type
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Verification did not create a session." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

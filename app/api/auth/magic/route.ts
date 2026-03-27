import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAuthConfigured, sendMagicAccess } from "@/lib/supabase-auth";

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
    };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email." },
        { status: 400 }
      );
    }

    await sendMagicAccess(email, `${request.nextUrl.origin}/auth/callback`);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

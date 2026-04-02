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
      createUser?: boolean;
      firstName?: string;
      lastName?: string;
    };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email." },
        { status: 400 }
      );
    }

    await sendMagicAccess({
      email,
      emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      createUser: body.createUser ?? false,
      firstName: body.firstName?.trim(),
      lastName: body.lastName?.trim()
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

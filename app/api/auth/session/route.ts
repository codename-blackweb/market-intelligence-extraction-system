import { NextRequest, NextResponse } from "next/server";
import { getUserFromAccessToken, isSupabaseAuthConfigured } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase auth is not configured." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };

    if (!body.accessToken) {
      return NextResponse.json(
        { success: false, error: "Missing access token." },
        { status: 400 }
      );
    }

    const user = await getUserFromAccessToken(body.accessToken);

    return NextResponse.json({
      success: true,
      session: {
        access_token: body.accessToken,
        refresh_token: body.refreshToken,
        expires_at: body.expiresAt,
        user
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

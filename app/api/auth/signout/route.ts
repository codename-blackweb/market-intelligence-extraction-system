import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAuthConfigured, signOutSupabaseSession } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json({
        success: true
      });
    }

    const body = (await request.json()) as {
      accessToken?: string;
    };

    if (body.accessToken) {
      await signOutSupabaseSession(body.accessToken);
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

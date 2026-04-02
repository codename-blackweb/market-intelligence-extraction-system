import { NextRequest, NextResponse } from "next/server";
import {
  isSupabaseAuthConfigured,
  signInWithPassword,
  signUpWithPassword
} from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase auth is not configured." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      mode?: "signin" | "signup";
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      workspaceName?: string;
      useCase?: string;
      teamSize?: string;
      industry?: string;
      inviteEmails?: string[];
      inviteRole?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password || (body.mode !== "signin" && body.mode !== "signup")) {
      return NextResponse.json(
        { success: false, error: "Missing auth payload." },
        { status: 400 }
      );
    }

    if (body.mode === "signin") {
      const session = await signInWithPassword(email, password);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unable to create a session." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        mode: "signin",
        session
      });
    }

    const callbackUrl = `${request.nextUrl.origin}/auth/callback`;
    const signupResult = await signUpWithPassword({
      email,
      password,
      firstName: body.firstName?.trim() ?? "",
      lastName: body.lastName?.trim() ?? "",
      emailRedirectTo: callbackUrl
    });

    return NextResponse.json({
      success: true,
      mode: "signup",
      session: signupResult.session,
      user: signupResult.user,
      emailConfirmationRequired: !signupResult.session
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

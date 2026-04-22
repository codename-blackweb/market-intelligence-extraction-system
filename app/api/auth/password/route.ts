import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfigDiagnostics } from "@/lib/supabase-core";
import {
  isSupabaseAuthConfigured,
  signInWithPassword,
  signUpWithPassword
} from "@/lib/supabase-auth";

export const runtime = "nodejs";

type PasswordAuthRequest = {
  mode?: "signin" | "signup";
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  workspaceName?: unknown;
  useCase?: unknown;
  teamSize?: unknown;
  industry?: unknown;
  inviteEmails?: unknown;
  inviteRole?: unknown;
};

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNormalizedEmail(value: unknown) {
  return getTrimmedString(value).toLowerCase();
}

function maskEmail(email: string | null) {
  if (!email) {
    return null;
  }

  const [localPart, domainPart] = email.split("@");

  if (!localPart || !domainPart) {
    return "[invalid-email]";
  }

  const visiblePrefix = localPart.slice(0, 2);
  return `${visiblePrefix}${"*".repeat(Math.max(1, localPart.length - visiblePrefix.length))}@${domainPart}`;
}

function getAuthErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status;

    if (typeof status === "number" && status >= 400 && status < 500) {
      return status;
    }

    if (status === 0) {
      return 503;
    }
  }

  if (error instanceof Error) {
    if (error.name === "AuthRetryableFetchError" || /fetch failed/i.test(error.message)) {
      return 503;
    }
  }

  return 500;
}

function getAuthErrorMessage(error: unknown, status: number) {
  if (status === 503) {
    return "Unable to reach Supabase auth. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Netlify.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown auth error";
}

function logAuthError(error: unknown, context: { mode: string | null; email: string | null }) {
  const normalizedError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          cause:
            error.cause instanceof Error
              ? {
                  name: error.cause.name,
                  message: error.cause.message
                }
              : error.cause ?? null
        }
      : {
          value: error
        };

  console.error("[AUTH ERROR]", {
    mode: context.mode,
    email: maskEmail(context.email),
    config: getSupabasePublicConfigDiagnostics(),
    error: normalizedError
  });
}

export async function POST(request: NextRequest) {
  let mode: "signin" | "signup" | null = null;
  let email: string | null = null;

  try {
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase auth is not configured." },
        { status: 503 }
      );
    }

    let body: PasswordAuthRequest;

    try {
      body = (await request.json()) as PasswordAuthRequest;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid auth payload." },
        { status: 400 }
      );
    }

    mode = body.mode === "signin" || body.mode === "signup" ? body.mode : null;
    email = getNormalizedEmail(body.email) || null;
    const password = getTrimmedString(body.password);

    if (!email || !password || !mode) {
      return NextResponse.json(
        { success: false, error: "Missing auth payload." },
        { status: 400 }
      );
    }

    if (mode === "signin") {
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
      firstName: getTrimmedString(body.firstName),
      lastName: getTrimmedString(body.lastName),
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
    const status = getAuthErrorStatus(error);
    const message = getAuthErrorMessage(error, status);

    logAuthError(error, {
      mode,
      email
    });

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

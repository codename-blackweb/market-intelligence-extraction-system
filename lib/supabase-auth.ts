import type { AuthSession, AuthSessionUser } from "@/types/market-analysis";

type SupabaseAuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: SupabaseAuthUser;
};

function getSupabaseAuthConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey
  };
}

async function supabaseAuthRequest(
  path: string,
  init?: RequestInit,
  accessToken?: string
) {
  const config = getSupabaseAuthConfig();

  if (!config) {
    throw new Error("Supabase auth is not configured.");
  }

  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function isSupabaseAuthConfigured() {
  return Boolean(getSupabaseAuthConfig());
}

export function normalizeAuthUser(user: SupabaseAuthUser): AuthSessionUser {
  const metadata = user.user_metadata ?? {};
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name : "";
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name : "";

  return {
    id: user.id,
    email: user.email ?? "",
    first_name: firstName,
    last_name: lastName,
    full_name: getFullName(firstName, lastName) || user.email || "Workspace User",
    created_at: user.created_at
  };
}

export function normalizeAuthSession(payload: SupabaseAuthResponse) {
  if (!payload.access_token || !payload.user) {
    return null;
  }

  const expiresAt =
    typeof payload.expires_at === "number"
      ? payload.expires_at
      : typeof payload.expires_in === "number"
        ? Math.floor(Date.now() / 1000) + payload.expires_in
        : undefined;

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: expiresAt,
    user: normalizeAuthUser(payload.user)
  } satisfies AuthSession;
}

export async function signInWithPassword(email: string, password: string) {
  const payload = (await supabaseAuthRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    })
  })) as SupabaseAuthResponse;

  return normalizeAuthSession(payload);
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  emailRedirectTo?: string;
}) {
  const payload = (await supabaseAuthRequest("signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: {
        first_name: input.firstName,
        last_name: input.lastName
      },
      options: input.emailRedirectTo
        ? {
            emailRedirectTo: input.emailRedirectTo
          }
        : undefined
    })
  })) as SupabaseAuthResponse & {
    user?: SupabaseAuthUser;
  };

  return {
    session: normalizeAuthSession(payload),
    user: payload.user ? normalizeAuthUser(payload.user) : null
  };
}

export async function sendMagicAccess(email: string, emailRedirectTo?: string) {
  await supabaseAuthRequest("otp", {
    method: "POST",
    body: JSON.stringify({
      email,
      create_user: false,
      options: emailRedirectTo
        ? {
            emailRedirectTo
          }
        : undefined
    })
  });
}

export async function sendRecoveryLink(email: string, redirectTo?: string) {
  await supabaseAuthRequest("recover", {
    method: "POST",
    body: JSON.stringify({
      email,
      redirect_to: redirectTo
    })
  });
}

export async function verifyEmailOtp(input: {
  email: string;
  token: string;
  type: "magiclink" | "recovery" | "signup";
}) {
  const payload = (await supabaseAuthRequest("verify", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      token: input.token,
      type: input.type
    })
  })) as SupabaseAuthResponse;

  return normalizeAuthSession(payload);
}

export async function getUserFromAccessToken(accessToken: string) {
  const payload = (await supabaseAuthRequest("user", undefined, accessToken)) as SupabaseAuthUser;
  return normalizeAuthUser(payload);
}

export async function signOutSupabaseSession(accessToken: string) {
  await supabaseAuthRequest(
    "logout",
    {
      method: "POST"
    },
    accessToken
  );
}

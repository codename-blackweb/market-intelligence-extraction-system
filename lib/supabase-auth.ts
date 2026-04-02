import type { EmailOtpType } from "@supabase/supabase-js";
import {
  createSupabaseAdminClient,
  createSupabaseServerAuthClient,
  getOAuthAuthorizeUrl,
  getOAuthProviderAvailability,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
  normalizeAuthSession,
  normalizeAuthUser
} from "@/lib/supabase-core";

export {
  getOAuthAuthorizeUrl,
  getOAuthProviderAvailability,
  isSupabaseConfigured as isSupabaseAuthConfigured,
  normalizeAuthSession,
  normalizeAuthUser
};

export async function signInWithPassword(email: string, password: string) {
  const client = createSupabaseServerAuthClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return normalizeAuthSession(data.session);
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  emailRedirectTo?: string;
}) {
  const client = createSupabaseServerAuthClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`.trim()
      }
    }
  });

  if (error) {
    throw error;
  }

  return {
    session: normalizeAuthSession(data.session),
    user: data.user ? normalizeAuthUser(data.user) : null
  };
}

export async function sendMagicAccess(input: {
  email: string;
  emailRedirectTo?: string;
  createUser?: boolean;
  firstName?: string;
  lastName?: string;
}) {
  const client = createSupabaseServerAuthClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { error } = await client.auth.signInWithOtp({
    email: input.email,
    options: {
      emailRedirectTo: input.emailRedirectTo,
      shouldCreateUser: input.createUser ?? false,
      data:
        input.firstName || input.lastName
          ? {
              first_name: input.firstName ?? "",
              last_name: input.lastName ?? "",
              full_name: `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim()
            }
          : undefined
    }
  });

  if (error) {
    throw error;
  }
}

export async function sendRecoveryLink(email: string, redirectTo?: string) {
  const client = createSupabaseServerAuthClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  if (error) {
    throw error;
  }
}

export async function verifyEmailOtp(input: {
  email?: string;
  token?: string;
  type: EmailOtpType;
  tokenHash?: string;
}) {
  const client = createSupabaseServerAuthClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { data, error } = await client.auth.verifyOtp(
    input.tokenHash
      ? {
          token_hash: input.tokenHash,
          type: input.type
        }
      : {
          email: input.email ?? "",
          token: input.token ?? "",
          type: input.type
        }
  );

  if (error) {
    throw error;
  }

  return normalizeAuthSession(data.session);
}

export async function getUserFromAccessToken(accessToken: string) {
  const client = createSupabaseServerAuthClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) {
    throw error ?? new Error("Unable to resolve the authenticated user.");
  }

  return normalizeAuthUser(data.user);
}

export async function signOutSupabaseSession(accessToken: string) {
  if (!isSupabaseServiceConfigured()) {
    return;
  }

  const client = createSupabaseAdminClient();

  if (!client) {
    throw new Error("Supabase auth is not configured.");
  }

  const { error } = await client.auth.admin.signOut(accessToken);

  if (error) {
    throw error;
  }
}

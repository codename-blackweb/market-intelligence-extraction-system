import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AuthSession, AuthSessionUser } from "@/types/market-analysis";

type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

type ServiceSupabaseConfig = PublicSupabaseConfig & {
  serviceRoleKey: string;
};

export function getSupabasePublicConfig(): PublicSupabaseConfig | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey
  };
}

export function getSupabaseServiceConfig(): ServiceSupabaseConfig | null {
  const publicConfig = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicConfig || !serviceRoleKey) {
    return null;
  }

  return {
    ...publicConfig,
    serviceRoleKey
  };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabasePublicConfig());
}

export function isSupabaseServiceConfigured() {
  return Boolean(getSupabaseServiceConfig());
}

export function getOAuthProviderAvailability() {
  return {
    google: process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED === "true",
    github: process.env.NEXT_PUBLIC_SUPABASE_GITHUB_AUTH_ENABLED === "true"
  };
}

export function createSupabaseServerAuthClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createSupabaseAdminClient(): SupabaseClient | null {
  const config = getSupabaseServiceConfig();

  if (config) {
    return createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  const publicConfig = getSupabasePublicConfig();

  if (!publicConfig) {
    return null;
  }

  return createClient(publicConfig.url, publicConfig.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createSupabaseUserClient(accessToken: string): SupabaseClient | null {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

function getMetadataName(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export function normalizeAuthUser(user: User): AuthSessionUser {
  const metadata = user.user_metadata ?? {};
  const firstName =
    getMetadataName(metadata, "first_name") ||
    getMetadataName(metadata, "given_name") ||
    getMetadataName(metadata, "name").split(" ")[0] ||
    "";
  const lastName =
    getMetadataName(metadata, "last_name") ||
    getMetadataName(metadata, "family_name") ||
    getMetadataName(metadata, "name").split(" ").slice(1).join(" ") ||
    "";
  const fullName =
    `${firstName} ${lastName}`.trim() ||
    getMetadataName(metadata, "full_name") ||
    getMetadataName(metadata, "name") ||
    user.email ||
    "Workspace User";
  const avatarUrl =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null;

  return {
    id: user.id,
    email: user.email ?? "",
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    avatar_url: avatarUrl,
    created_at: user.created_at
  };
}

export function normalizeAuthSession(session: Session | null): AuthSession | null {
  if (!session?.access_token || !session.user) {
    return null;
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: normalizeAuthUser(session.user)
  };
}

export function getOAuthAuthorizeUrl(
  provider: "google" | "github",
  redirectTo: string,
  query?: Record<string, string>
) {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const url = new URL(`${config.url}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", redirectTo);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

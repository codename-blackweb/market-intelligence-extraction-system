export const MAGIC_ACCESS_UNAVAILABLE_MESSAGE =
  "Magic access is temporarily unavailable. Use password sign-in for now.";

export type AuthCapabilities = {
  password: boolean;
  magic: boolean;
  google: boolean;
  github: boolean;
};

function isEnabled(...keys: string[]) {
  return keys.some((key) => process.env[key] === "true");
}

export function getAuthCapabilities(): AuthCapabilities {
  const passwordEnabled =
    process.env.NEXT_PUBLIC_ENABLE_PASSWORD_AUTH === "false" ? false : true;
  const magicRequested = isEnabled(
    "NEXT_PUBLIC_ENABLE_MAGIC_AUTH",
    "NEXT_PUBLIC_SUPABASE_MAGIC_ACCESS_ENABLED"
  );
  const magicVerified = isEnabled("NEXT_PUBLIC_MAGIC_AUTH_VERIFIED");

  return {
    password: passwordEnabled,
    magic: magicRequested && magicVerified,
    google: isEnabled(
      "NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH",
      "NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED"
    ),
    github: isEnabled(
      "NEXT_PUBLIC_ENABLE_GITHUB_OAUTH",
      "NEXT_PUBLIC_SUPABASE_GITHUB_AUTH_ENABLED"
    )
  };
}

export function isMagicAccessEnabled() {
  return getAuthCapabilities().magic;
}

export function getOAuthProviderAvailability() {
  const capabilities = getAuthCapabilities();
  return {
    google: capabilities.google,
    github: capabilities.github
  };
}

export const MAGIC_ACCESS_UNAVAILABLE_MESSAGE =
  "Magic access is temporarily unavailable. Use password sign-in for now.";

export type AuthCapabilities = {
  password: boolean;
  magic: boolean;
  google: boolean;
  github: boolean;
};

const passwordEnv = process.env.NEXT_PUBLIC_ENABLE_PASSWORD_AUTH;
const magicEnv = process.env.NEXT_PUBLIC_ENABLE_MAGIC_AUTH;
const magicVerifiedEnv = process.env.NEXT_PUBLIC_MAGIC_AUTH_VERIFIED;
const legacyMagicEnv = process.env.NEXT_PUBLIC_SUPABASE_MAGIC_ACCESS_ENABLED;
const googleEnv = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH;
const githubEnv = process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH;
const legacyGoogleEnv = process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED;
const legacyGithubEnv = process.env.NEXT_PUBLIC_SUPABASE_GITHUB_AUTH_ENABLED;

export function isPasswordAuthEnabled() {
  return passwordEnv === "false" ? false : true;
}

export function isMagicAuthRequested() {
  return magicEnv === "true" || legacyMagicEnv === "true";
}

export function isMagicAuthVerified() {
  return magicVerifiedEnv === "true";
}

export function isGoogleOAuthEnabled() {
  if (googleEnv === "true") {
    return true;
  }

  if (googleEnv === "false") {
    return false;
  }

  return legacyGoogleEnv === "true";
}

export function isGitHubOAuthEnabled() {
  if (githubEnv === "true") {
    return true;
  }

  if (githubEnv === "false") {
    return false;
  }

  return legacyGithubEnv === "true";
}

export function getAuthCapabilities(): AuthCapabilities {
  return {
    password: isPasswordAuthEnabled(),
    magic: isMagicAuthRequested() && isMagicAuthVerified(),
    google: isGoogleOAuthEnabled(),
    github: isGitHubOAuthEnabled()
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

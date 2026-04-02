export const MAGIC_ACCESS_UNAVAILABLE_MESSAGE =
  "Magic access is temporarily unavailable. Use password sign-in for now.";

export function isMagicAccessEnabled() {
  return process.env.NEXT_PUBLIC_SUPABASE_MAGIC_ACCESS_ENABLED === "true";
}

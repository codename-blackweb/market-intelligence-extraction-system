import type { NextRequest } from "next/server";
import { getUserFromAccessToken } from "@/lib/supabase-auth";
import type { AuthSessionUser } from "@/types/market-analysis";

export function getAccessTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function getAuthenticatedRequestUser(request: NextRequest): Promise<{
  accessToken: string;
  user: AuthSessionUser;
} | null> {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return null;
  }

  const user = await getUserFromAccessToken(accessToken);
  return {
    accessToken,
    user
  };
}

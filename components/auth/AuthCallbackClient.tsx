"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { clearPendingOnboarding, loadPendingOnboarding } from "@/lib/pending-onboarding";
import { normalizeAuthSession } from "@/lib/supabase-core";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PENDING_PLAN_STORAGE_KEY } from "@/lib/client-identity";
import type { AuthSession } from "@/types/market-analysis";

function parseHashParams(hash: string) {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(normalized);
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [message, setMessage] = useState("Finalizing secure access...");
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const client = getSupabaseBrowserClient();

      if (!client) {
        if (isMounted) {
          setMessage("Supabase auth is not configured.");
        }
        return;
      }

      const hashParams = parseHashParams(window.location.hash);
      const queryParams = new URLSearchParams(window.location.search);
      const error = hashParams.get("error_description") || queryParams.get("error_description");

      if (error) {
        if (isMounted) {
          setMessage(error);
        }
        return;
      }

      try {
        let resolvedSession: AuthSession | null = null;
        const tokenHash = queryParams.get("token_hash");
        const type = queryParams.get("type");
        const code = queryParams.get("code");
        const hashAccessToken = hashParams.get("access_token");

        if (tokenHash && type) {
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              tokenHash,
              type
            })
          });
          const json = (await response.json()) as {
            success: boolean;
            session?: AuthSession | null;
            error?: string;
          };

          if (!response.ok || !json.success || !json.session) {
            throw new Error(json.error || "Unable to verify secure access.");
          }

          resolvedSession = json.session;
        } else if (code) {
          const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          resolvedSession = normalizeAuthSession(data.session);
        } else if (hashAccessToken) {
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              accessToken: hashAccessToken,
              refreshToken: hashParams.get("refresh_token") ?? undefined,
              expiresAt: hashParams.get("expires_at")
                ? Number(hashParams.get("expires_at"))
                : undefined
            })
          });
          const json = (await response.json()) as {
            success: boolean;
            session?: AuthSession | null;
            error?: string;
          };

          if (!response.ok || !json.success || !json.session) {
            throw new Error(json.error || "Unable to initialize your session.");
          }

          resolvedSession = json.session;
        } else {
          const {
            data: { session }
          } = await client.auth.getSession();
          resolvedSession = normalizeAuthSession(session);
        }

        if (!resolvedSession) {
          throw new Error("No secure session was found in the callback.");
        }

        await setSession(resolvedSession);

        const pendingOnboarding = loadPendingOnboarding();
        const bootstrapResponse = await fetch("/api/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resolvedSession.access_token}`
          },
          body: JSON.stringify(pendingOnboarding ?? {})
        });
        const bootstrapJson = (await bootstrapResponse.json()) as {
          success: boolean;
          error?: string;
        };

        if (!bootstrapResponse.ok || !bootstrapJson.success) {
          throw new Error(bootstrapJson.error || "Unable to initialize your workspace.");
        }

        clearPendingOnboarding();

        const pendingPlan =
          typeof window !== "undefined"
            ? window.localStorage.getItem(PENDING_PLAN_STORAGE_KEY)
            : null;

        if ((pendingPlan === "pro" || pendingPlan === "agency") && checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }

        router.replace(pendingPlan === "pro" || pendingPlan === "agency" ? "/upgrade/success" : "/account");
      } catch (callbackError) {
        if (isMounted) {
          const nextMessage =
            callbackError instanceof Error
              ? callbackError.message
              : "Unable to finalize your access.";
          setMessage(nextMessage);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [checkoutUrl, router, setSession]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-zinc-900/80 p-10 text-center shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
          Secure Callback
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Connecting your workspace</h1>
        <p className="mt-4 text-zinc-400">{message}</p>
      </div>
    </main>
  );
}

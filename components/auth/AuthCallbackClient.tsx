"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

function parseHashParams(hash: string) {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(normalized);
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [message, setMessage] = useState("Finalizing secure access...");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const hashParams = parseHashParams(window.location.hash);
      const queryParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
      const expiresAtRaw = hashParams.get("expires_at") || queryParams.get("expires_at");
      const error = hashParams.get("error_description") || queryParams.get("error_description");

      if (error) {
        if (isMounted) {
          setMessage(error);
        }
        return;
      }

      if (!accessToken) {
        if (isMounted) {
          setMessage("No secure session was found in the callback.");
        }
        return;
      }

      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accessToken,
            refreshToken: refreshToken ?? undefined,
            expiresAt: expiresAtRaw ? Number(expiresAtRaw) : undefined
          })
        });
        const json = (await response.json()) as {
          success: boolean;
          session?: Parameters<typeof setSession>[0];
          error?: string;
        };

        if (!response.ok || !json.success || !json.session) {
          throw new Error(json.error || "Unable to initialize your session.");
        }

        setSession(json.session);
        router.replace("/account");
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
  }, [router, setSession]);

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

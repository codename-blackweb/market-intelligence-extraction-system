"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

type AuthView = "signin" | "magic" | "recovery" | "verify";

const segmentedViews: Array<{ id: AuthView; label: string }> = [
  { id: "signin", label: "Password" },
  { id: "magic", label: "Magic Access" },
  { id: "recovery", label: "Recover" },
  { id: "verify", label: "Verify" }
];

function getInitialView(viewParam: string | null): AuthView {
  if (
    viewParam === "signin" ||
    viewParam === "magic" ||
    viewParam === "recovery" ||
    viewParam === "verify"
  ) {
    return viewParam;
  }

  return "signin";
}

export default function AuthAccessShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [view, setView] = useState<AuthView>(getInitialView(searchParams.get("view")));
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const passkeySupported = false;

  const hint = useMemo(() => {
    switch (view) {
      case "magic":
        return {
          title: "Magic Access",
          copy:
            "Enter your email address to receive a secure one-time access link and continue directly into your workspace."
        };
      case "recovery":
        return {
          title: "Recover Your Access",
          copy:
            "Enter your email address and we’ll send a secure recovery link so you can reset your password and regain access to your workspace."
        };
      case "verify":
        return {
          title: "2-Step Verification",
          copy:
            "Enter the 6-digit verification code to continue securely into your workspace."
        };
      default:
        return {
          title: "Access Your Workspace",
          copy: "Sign in to continue your demand intelligence workflow."
        };
    }
  }, [view]);

  const handlePasswordSignIn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "signin",
          email,
          password,
          rememberSession
        })
      });

      const json = (await response.json()) as {
        success: boolean;
        session?: Parameters<typeof setSession>[0];
        error?: string;
      };

      if (!response.ok || !json.success || !json.session) {
        throw new Error(json.error || "Unable to continue.");
      }

      setSession(json.session);
      router.push("/account");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Unable to continue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicAccess = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/magic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email
        })
      });
      const json = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to send magic access.");
      }

      setSuccess("Magic access sent. Check your inbox for a secure sign-in link.");
      setView("verify");
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : "Unable to send magic access.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email
        })
      });
      const json = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to send recovery link.");
      }

      setSuccess("Recovery Link Sent");
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : "Unable to send recovery link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          token: verificationCode,
          type: "magiclink"
        })
      });
      const json = (await response.json()) as {
        success: boolean;
        session?: Parameters<typeof setSession>[0];
        error?: string;
      };

      if (!response.ok || !json.success || !json.session) {
        throw new Error(json.error || "Unable to verify access.");
      }

      setSession(json.session);
      router.push("/account");
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : "Unable to verify access.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-8 text-center">
              <motion.div
                animate={{ scale: 1 }}
                className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
                initial={{ scale: 0.9 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                {view === "verify" ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </motion.div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {hint.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {hint.copy}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {segmentedViews.map((item) => (
                <button
                  className={`rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                    view === item.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                  key={item.id}
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setView(item.id);
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 text-sm font-semibold text-zinc-900 outline-none transition-all focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@workspace.com"
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              {view === "signin" ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Password
                      </label>
                      <button
                        className="text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                        onClick={() => setView("recovery")}
                        type="button"
                      >
                        Forgot Password
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 text-sm font-semibold text-zinc-900 outline-none transition-all focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        type="password"
                        value={password}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <input
                      checked={rememberSession}
                      className="h-4 w-4 rounded border-zinc-300"
                      onChange={(event) => setRememberSession(event.target.checked)}
                      type="checkbox"
                    />
                    Remember session
                  </label>

                  <button
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110 dark:bg-zinc-100 dark:text-zinc-900"
                    disabled={loading}
                    onClick={handlePasswordSignIn}
                    type="button"
                  >
                    {loading ? "Continuing..." : "Continue"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </button>
                </>
              ) : null}

              {view === "magic" ? (
                <>
                  <button
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110 dark:bg-zinc-100 dark:text-zinc-900"
                    disabled={loading}
                    onClick={handleMagicAccess}
                    type="button"
                  >
                    {loading ? "Sending..." : "Send Magic Access"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </button>
                  <p className="text-center text-xs font-semibold text-zinc-400">
                    No password required • Secure access flow
                  </p>
                </>
              ) : null}

              {view === "recovery" ? (
                <>
                  <button
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110 dark:bg-zinc-100 dark:text-zinc-900"
                    disabled={loading}
                    onClick={handleRecovery}
                    type="button"
                  >
                    {loading ? "Sending..." : "Send Recovery Link"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </button>
                  {success === "Recovery Link Sent" ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        Recovery Link Sent
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Check your inbox for a secure password reset link.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {view === "verify" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Verification Code
                    </label>
                    <input
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-center text-lg font-black tracking-[0.4em] text-zinc-900 outline-none transition-all focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                      maxLength={6}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder="123456"
                      type="text"
                      value={verificationCode}
                    />
                  </div>
                  <button
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110 dark:bg-zinc-100 dark:text-zinc-900"
                    disabled={loading}
                    onClick={handleVerification}
                    type="button"
                  >
                    {loading ? "Verifying..." : "Verify and Continue"}
                  </button>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                    <button onClick={() => setView("magic")} type="button">
                      Resend Code
                    </button>
                    {passkeySupported ? (
                      <button type="button">Use Passkey</button>
                    ) : (
                      <button className="opacity-40" disabled type="button">
                        Use Passkey
                      </button>
                    )}
                    <button onClick={() => setView("signin")} type="button">
                      Back to Login
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
            {success && success !== "Recovery Link Sent" ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{success}</p>
            ) : null}

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-100 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.24em]">
                <span className="bg-white px-4 text-zinc-400 dark:bg-zinc-950">Workspace Access</span>
              </div>
            </div>

            <p className="text-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              New here?{" "}
              <Link className="font-black text-zinc-900 dark:text-zinc-100" href="/onboarding">
                Create your account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

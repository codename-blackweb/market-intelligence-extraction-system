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
  const inputClassName =
    "h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 text-xs font-bold text-zinc-900 outline-none transition-all focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100";
  const primaryButtonClassName =
    "w-full h-11 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black rounded-xl shadow-lg transition-all hover:brightness-110 active:scale-[0.98] uppercase tracking-[0.2em]";
  const secondaryButtonClassName =
    "h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all font-black text-[9px] uppercase tracking-widest";

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
    <section className="min-h-screen w-full flex items-center justify-center p-4 bg-white dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="relative">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 mb-4 shadow-lg shadow-zinc-200 dark:shadow-none"
              >
                {view === "verify" ? (
                  <ShieldCheck className="w-5 h-5 text-white dark:text-zinc-900" />
                ) : view === "magic" ? (
                  <Mail className="w-5 h-5 text-white dark:text-zinc-900" />
                ) : (
                  <Lock className="w-5 h-5 text-white dark:text-zinc-900" />
                )}
              </motion.div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {hint.title}
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest leading-relaxed">
                {hint.copy}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {segmentedViews.map((item) => (
                <button
                  className={`rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-[0.16em] transition-colors ${
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

            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              {view !== "verify" ? (
                <div className="space-y-1.5">
                  <label
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1"
                    htmlFor="auth-email"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      id="auth-email"
                      type="email"
                      placeholder="user@workspace.com"
                      className={inputClassName}
                      onChange={(event) => setEmail(event.target.value)}
                      value={email}
                    />
                  </div>
                </div>
              ) : null}

              {view === "signin" ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label
                        className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                        htmlFor="auth-password"
                      >
                        Password
                      </label>
                      <button
                        className="text-[9px] font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors uppercase tracking-widest"
                        onClick={() => setView("recovery")}
                        type="button"
                      >
                        Forgot Password
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        id="auth-password"
                        type="password"
                        placeholder="••••••••"
                        className={inputClassName}
                        onChange={(event) => setPassword(event.target.value)}
                        value={password}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 px-1">
                    <input
                      id="remember"
                      checked={rememberSession}
                      className="h-4 w-4 rounded border border-zinc-300 bg-transparent accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-100"
                      onChange={(event) => setRememberSession(event.target.checked)}
                      type="checkbox"
                    />
                    <label
                      htmlFor="remember"
                      className="text-[10px] font-bold text-zinc-400 cursor-pointer select-none uppercase tracking-wide"
                    >
                      Persistent session (30d)
                    </label>
                  </div>

                  <button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handlePasswordSignIn}
                    type="button"
                  >
                    {loading ? "Continuing..." : "Continue"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5 inline-flex" />
                  </button>
                </>
              ) : null}

              {view === "magic" ? (
                <>
                  <button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handleMagicAccess}
                    type="button"
                  >
                    {loading ? "Sending..." : "Send Magic Access"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5 inline-flex" />
                  </button>
                  <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    No password required • Secure access flow
                  </p>
                </>
              ) : null}

              {view === "recovery" ? (
                <>
                  <button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handleRecovery}
                    type="button"
                  >
                    {loading ? "Sending..." : "Send Recovery Link"}
                    <ArrowRight className="ml-2 h-3.5 w-3.5 inline-flex" />
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
                    <label
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1"
                      htmlFor="verification-code"
                    >
                      Verification Code
                    </label>
                    <input
                      id="verification-code"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-center text-lg font-black tracking-[0.4em] text-zinc-900 outline-none transition-all focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
                      maxLength={6}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder="123456"
                      type="text"
                      value={verificationCode}
                    />
                  </div>
                  <button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handleVerification}
                    type="button"
                  >
                    {loading ? "Verifying..." : "Verify and Continue"}
                  </button>
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
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
            </form>

            {error ? <p className="mt-4 text-[11px] font-semibold text-red-500">{error}</p> : null}
            {success && success !== "Recovery Link Sent" ? (
              <p className="mt-4 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                {success}
              </p>
            ) : null}

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-100 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.3em]">
                <span className="bg-white dark:bg-zinc-950 px-4 text-zinc-400 translate-y-[1px]">
                  Connected Providers
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className={secondaryButtonClassName} type="button">
                <span className="inline-flex items-center justify-center">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 1C5.925 1 1 5.925 1 12c0 4.86 3.149 8.982 7.516 10.436.55.102.75-.239.75-.532 0-.264-.01-.963-.016-1.89-3.058.664-3.703-1.474-3.703-1.474-.5-1.27-1.221-1.608-1.221-1.608-.998-.682.076-.668.076-.668 1.103.078 1.684 1.132 1.684 1.132.98 1.68 2.571 1.194 3.198.913.1-.709.384-1.194.698-1.469-2.441-.278-5.008-1.221-5.008-5.434 0-1.2.429-2.182 1.132-2.951-.113-.278-.49-1.396.108-2.911 0 0 .923-.295 3.025 1.128A10.53 10.53 0 0 1 12 6.32c.936.004 1.879.127 2.758.372 2.1-1.423 3.022-1.128 3.022-1.128.6 1.515.223 2.633.11 2.911.705.769 1.13 1.751 1.13 2.951 0 4.223-2.57 5.153-5.018 5.426.394.34.745 1.01.745 2.036 0 1.469-.013 2.654-.013 3.015 0 .295.198.64.756.531C19.854 20.978 23 16.858 23 12c0-6.075-4.925-11-11-11Z"
                      fill="currentColor"
                    />
                  </svg>
                  GitHub
                </span>
              </button>
              <button className={secondaryButtonClassName} type="button">
                <span className="inline-flex items-center justify-center">
                  <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="currentColor"
                      className="opacity-80"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="currentColor"
                      className="opacity-60"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="currentColor"
                      className="opacity-40"
                    />
                  </svg>
                  Google
                </span>
              </button>
            </div>

            <p className="text-center mt-7 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              New here?{" "}
              <Link href="/onboarding" className="font-black text-zinc-900 dark:text-zinc-100 hover:underline">
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

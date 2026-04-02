"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  getAuthCapabilities,
  isMagicAccessEnabled,
  MAGIC_ACCESS_UNAVAILABLE_MESSAGE
} from "@/lib/auth-capabilities";
import { persistPendingPlan } from "@/lib/client-identity";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AuthSession } from "@/types/market-analysis";

type AuthView = "signin" | "magic" | "recovery" | "verify";

function getInitialView(
  viewParam: string | null,
  input: { magicAccessEnabled: boolean; passwordAuthEnabled: boolean }
): AuthView {
  if (input.passwordAuthEnabled && (viewParam === "signin" || viewParam === "recovery")) {
    return viewParam;
  }

  if (input.magicAccessEnabled && (viewParam === "magic" || viewParam === "verify")) {
    return viewParam;
  }

  if (input.passwordAuthEnabled) {
    return "signin";
  }

  return input.magicAccessEnabled ? "magic" : "signin";
}

export default function AuthAccessShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const requestedPlan = searchParams.get("plan");
  const upgradePlan =
    requestedPlan === "pro" || requestedPlan === "agency" ? requestedPlan : null;
  const authCapabilities = getAuthCapabilities();
  const magicAccessEnabled = isMagicAccessEnabled();
  const passwordAuthEnabled = authCapabilities.password;
  const providerAvailability = {
    google: authCapabilities.google,
    github: authCapabilities.github
  };
  const enabledProviders = [
    providerAvailability.github ? "github" : null,
    providerAvailability.google ? "google" : null
  ].filter(Boolean) as Array<"github" | "google">;
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";
  const [view, setView] = useState<AuthView>(
    getInitialView(searchParams.get("view"), { magicAccessEnabled, passwordAuthEnabled })
  );
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const passkeySupported = false;
  const inputClassName = "auth-input";
  const primaryButtonClassName = "auth-primary-button";
  const secondaryButtonClassName = "auth-provider-button";
  const planLabel =
    upgradePlan === "pro" ? "Unlocking Pro" : upgradePlan === "agency" ? "Unlocking Agency" : null;
  const segmentedViews: Array<{ id: AuthView; label: string }> = magicAccessEnabled
    ? [
        ...(passwordAuthEnabled ? [{ id: "signin" as const, label: "Password" }] : []),
        { id: "magic" as const, label: "Magic Access" },
        ...(passwordAuthEnabled ? [{ id: "recovery" as const, label: "Recover" }] : [])
      ]
    : passwordAuthEnabled
      ? [
        { id: "signin", label: "Password" },
        { id: "recovery", label: "Recover" }
      ]
      : [];

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

  const hintCopy =
    planLabel && view === "signin"
      ? `${hint.copy} Continue to unlock ${upgradePlan === "agency" ? "Agency" : "Pro"}.`
      : hint.copy;

  useEffect(() => {
    const nextCapabilityView = getInitialView(searchParams.get("view"), {
      magicAccessEnabled,
      passwordAuthEnabled
    });
    setView(nextCapabilityView);
    setEmail(searchParams.get("email") ?? "");
    if (!magicAccessEnabled) {
      const requestedView = searchParams.get("view");

      if (requestedView === "magic" || requestedView === "verify") {
        setError(MAGIC_ACCESS_UNAVAILABLE_MESSAGE);
      }
    }
  }, [magicAccessEnabled, passwordAuthEnabled, searchParams]);

  useEffect(() => {
    const previousBodyBackground = document.body.style.background;
    const previousBodyColor = document.body.style.color;
    const previousHtmlBackground = document.documentElement.style.background;

    document.body.style.background = "#050505";
    document.body.style.color = "#f4f4f5";
    document.documentElement.style.background = "#050505";

    return () => {
      document.body.style.background = previousBodyBackground;
      document.body.style.color = previousBodyColor;
      document.documentElement.style.background = previousHtmlBackground;
    };
  }, []);

  const bootstrapAuthenticatedAccount = async (accessToken: string) => {
    const response = await fetch("/api/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(json?.error || "Unable to initialize your account.");
    }
  };

  const routePostAuth = () => {
    if (upgradePlan) {
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      router.push("/billing");
      return;
    }

    router.push("/account");
  };

  const finalizeSession = async (session: AuthSession | null) => {
    if (!session) {
      throw new Error("Unable to continue.");
    }

    await setSession(session);
    await bootstrapAuthenticatedAccount(session.access_token);
    routePostAuth();
  };

  const handleProviderClick = async (provider: "github" | "google") => {
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const client = getSupabaseBrowserClient();

      if (!client) {
        throw new Error("Supabase auth is not configured.");
      }

      if (upgradePlan && checkoutUrl) {
        persistPendingPlan(upgradePlan);
      }

      const { error: oauthError } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Unable to continue.";
      setError(message);
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!passwordAuthEnabled) {
      setError("Password sign-in is currently unavailable.");
      return;
    }

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
        session?: AuthSession | null;
        error?: string;
      };

      if (!response.ok || !json.success || !json.session) {
        throw new Error(json.error || "Unable to continue.");
      }

      await finalizeSession(json.session);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Unable to continue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicAccess = async () => {
    if (!magicAccessEnabled) {
      setError(MAGIC_ACCESS_UNAVAILABLE_MESSAGE);
      setView("signin");
      return;
    }

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

      setSuccess("Magic access sent. Check your inbox for a secure sign-in link or code.");
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
    if (!passwordAuthEnabled) {
      setError("Password recovery is currently unavailable.");
      return;
    }

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
    if (!magicAccessEnabled) {
      setError(MAGIC_ACCESS_UNAVAILABLE_MESSAGE);
      setView("signin");
      return;
    }

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
          type: "email"
        })
      });
      const json = (await response.json()) as {
        success: boolean;
        session?: AuthSession | null;
        error?: string;
      };

      if (!response.ok || !json.success || !json.session) {
        throw new Error(json.error || "Unable to verify access.");
      }

      await finalizeSession(json.session);
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : "Unable to verify access.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-page-glow auth-page-glow-left" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-right" aria-hidden="true" />

      <div className="auth-page-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="auth-shell"
        >
          <div className="auth-card">
            <div className="auth-header">
              {planLabel ? <div className="auth-plan-pill">{planLabel}</div> : null}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="auth-icon-shell"
              >
                {view === "verify" ? (
                  <ShieldCheck className="auth-icon" />
                ) : view === "magic" ? (
                  <Mail className="auth-icon" />
                ) : (
                  <Lock className="auth-icon" />
                )}
              </motion.div>
              <h1 className="auth-title">{hint.title}</h1>
              <p className="auth-copy">{hintCopy}</p>
            </div>

            <div className="auth-segments">
              {segmentedViews.map((item) => (
                <button
                  className={`auth-segment ${view === item.id ? "is-active" : ""}`}
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

            {!magicAccessEnabled ? (
              <p className="auth-message auth-message-warning">{MAGIC_ACCESS_UNAVAILABLE_MESSAGE}</p>
            ) : null}

            <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
              {view !== "verify" ? (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-email">
                    Work Email
                  </label>
                  <div className="auth-input-shell">
                    <Mail className="auth-input-icon" />
                    <Input
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
                  <div className="auth-field">
                    <div className="auth-field-head">
                      <label className="auth-label" htmlFor="auth-password">
                        Password
                      </label>
                      <button
                        className="auth-inline-link"
                        onClick={() => setView("recovery")}
                        type="button"
                      >
                        Forgot Password
                      </button>
                    </div>
                    <div className="auth-input-shell">
                      <KeyRound className="auth-input-icon" />
                      <Input
                        id="auth-password"
                        type="password"
                        placeholder="••••••••"
                        className={inputClassName}
                        onChange={(event) => setPassword(event.target.value)}
                        value={password}
                      />
                    </div>
                  </div>

                  <div className="auth-remember">
                    <Checkbox
                      id="remember"
                      checked={rememberSession}
                      className="auth-checkbox"
                      onChange={(event) => setRememberSession(event.target.checked)}
                    />
                    <label htmlFor="remember" className="auth-remember-label">
                      Persistent session (30d)
                    </label>
                  </div>

                  <Button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handlePasswordSignIn}
                  >
                    {loading ? "Continuing..." : "Continue"}
                    <ArrowRight className="auth-button-arrow" />
                  </Button>
                </>
              ) : null}

              {view === "magic" ? (
                <>
                  <Button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handleMagicAccess}
                  >
                    {loading ? "Sending..." : "Send Magic Access"}
                    <ArrowRight className="auth-button-arrow" />
                  </Button>
                  <p className="auth-magic-note">No password required • Secure access flow</p>
                </>
              ) : null}

              {view === "recovery" ? (
                <>
                  <Button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handleRecovery}
                  >
                    {loading ? "Sending..." : "Send Recovery Link"}
                    <ArrowRight className="auth-button-arrow" />
                  </Button>
                  {success === "Recovery Link Sent" ? (
                    <div className="auth-success-card">
                      <p className="auth-success-title">Recovery Link Sent</p>
                      <p className="auth-success-copy">
                        Check your inbox for a secure password reset link.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {view === "verify" ? (
                <>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="verification-code">
                      Verification Code
                    </label>
                    <Input
                      id="verification-code"
                      className="auth-input auth-code-input"
                      maxLength={6}
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder="123456"
                      type="text"
                      value={verificationCode}
                    />
                  </div>
                  <Button
                    className={primaryButtonClassName}
                    disabled={loading}
                    onClick={handleVerification}
                  >
                    {loading ? "Verifying..." : "Verify and Continue"}
                  </Button>
                  <div className="auth-verify-actions">
                    <button
                      className="auth-inline-link"
                      onClick={() => void handleMagicAccess()}
                      type="button"
                    >
                      Resend Code
                    </button>
                    {passkeySupported ? (
                      <button className="auth-inline-link" type="button">
                        Use Passkey
                      </button>
                    ) : (
                      <button className="auth-inline-link is-disabled" disabled type="button">
                        Use Passkey
                      </button>
                    )}
                    <button
                      className="auth-inline-link"
                      onClick={() => setView("signin")}
                      type="button"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              ) : null}
            </form>

            {error ? <p className="auth-message auth-message-error">{error}</p> : null}
            {success && success !== "Recovery Link Sent" ? (
              <p className="auth-message auth-message-success">{success}</p>
            ) : null}

            {enabledProviders.length ? (
              <>
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <div className="auth-divider-label">
                    <span>Workspace Providers</span>
                  </div>
                </div>

                <div className="auth-provider-grid">
                  {providerAvailability.github ? (
                    <Button
                      className={secondaryButtonClassName}
                      disabled={loading}
                      onClick={() => void handleProviderClick("github")}
                      type="button"
                      variant="outline"
                    >
                      <span className="auth-provider-inner">
                        <svg
                          className="auth-provider-svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 1C5.925 1 1 5.925 1 12c0 4.86 3.149 8.982 7.516 10.436.55.102.75-.239.75-.532 0-.264-.01-.963-.016-1.89-3.058.664-3.703-1.474-3.703-1.474-.5-1.27-1.221-1.608-1.221-1.608-.998-.682.076-.668.076-.668 1.103.078 1.684 1.132 1.684 1.132.98 1.68 2.571 1.194 3.198.913.1-.709.384-1.194.698-1.469-2.441-.278-5.008-1.221-5.008-5.434 0-1.2.429-2.182 1.132-2.951-.113-.278-.49-1.396.108-2.911 0 0 .923-.295 3.025 1.128A10.53 10.53 0 0 1 12 6.32c.936.004 1.879.127 2.758.372 2.1-1.423 3.022-1.128 3.022-1.128.6 1.515.223 2.633.11 2.911.705.769 1.13 1.751 1.13 2.951 0 4.223-2.57 5.153-5.018 5.426.394.34.745 1.01.745 2.036 0 1.469-.013 2.654-.013 3.015 0 .295.198.64.756.531C19.854 20.978 23 16.858 23 12c0-6.075-4.925-11-11-11Z"
                            fill="currentColor"
                          />
                        </svg>
                        GitHub
                      </span>
                    </Button>
                  ) : null}
                  {providerAvailability.google ? (
                    <Button
                      className={secondaryButtonClassName}
                      disabled={loading}
                      onClick={() => void handleProviderClick("google")}
                      type="button"
                      variant="outline"
                    >
                      <span className="auth-provider-inner">
                        <svg
                          className="auth-provider-svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
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
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

            <p className="auth-footer-copy">
              New here?{" "}
              <Link
                href={upgradePlan ? `/onboarding?plan=${upgradePlan}` : "/onboarding"}
                className="auth-footer-link"
              >
                Create your account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

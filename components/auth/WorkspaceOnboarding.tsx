"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAuthCapabilities,
  isMagicAccessEnabled,
  MAGIC_ACCESS_UNAVAILABLE_MESSAGE
} from "@/lib/auth-capabilities";
import { persistPendingPlan } from "@/lib/client-identity";
import { persistPendingOnboarding } from "@/lib/pending-onboarding";
import type { AuthSession, UserPlan } from "@/types/market-analysis";

const steps = [
  {
    eyebrow: "Step 1 of 3",
    title: "Workspace Setup",
    supporting:
      "Create your account to start turning live demand signals into usable strategic direction.",
    instruction:
      "Set up your profile, define the workspace context, and invite collaborators only if you need them.",
    sectionLabel: "Owner Identity",
    sectionHelper: "Set the owner identity for this workspace."
  },
  {
    eyebrow: "Step 2 of 3",
    title: "Workspace Context",
    supporting: "Define the context that will shape this workspace from the first analysis.",
    instruction:
      "Use this information to tailor the workspace defaults and keep the output aligned to the right operating context.",
    sectionLabel: "Workspace Details",
    sectionHelper: "Set the core context for this workspace."
  },
  {
    eyebrow: "Step 3 of 3",
    title: "Invite Collaborators",
    supporting: "Add teammates now or keep this workspace personal for the first run.",
    instruction:
      "You can skip this and invite collaborators later if you want to keep the setup lean for now.",
    sectionLabel: "Team Access",
    sectionHelper: "Invite collaborators only if you need them."
  }
] as const;

const useCaseOptions = [
  "Founder / Product Validation",
  "Marketing Strategy",
  "Agency Research",
  "Competitive Intelligence",
  "Messaging / Positioning"
];

const teamSizeOptions = ["Just me", "2-5", "6-15", "16-50", "50+"] as const;

const industryOptions = [
  "SaaS",
  "Services",
  "E-commerce",
  "Marketplace",
  "Media",
  "Health",
  "Finance",
  "Education",
  "Other"
];

const labelClassName = "auth-label !ml-0";
const inputClassName = "auth-input onboarding-input !pl-4";
const selectClassName =
  "ui-input onboarding-select min-h-[2.75rem] px-4";
const textareaClassName =
  "ui-input onboarding-textarea min-h-[8.5rem] resize-none px-4 py-3";

type AccountMethod = "password" | "magic";

export default function WorkspaceOnboarding({
  initialEmail = "",
  initialPlan = null
}: {
  initialEmail?: string;
  initialPlan?: Exclude<UserPlan, "free"> | null;
}) {
  const router = useRouter();
  const { setSession } = useAuth();
  const authCapabilities = getAuthCapabilities();
  const magicAccessEnabled = isMagicAccessEnabled();
  const passwordAuthEnabled = authCapabilities.password;
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";
  const [step, setStep] = useState(0);
  const [accountMethod, setAccountMethod] = useState<AccountMethod>(
    passwordAuthEnabled ? "password" : "magic"
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [useCase, setUseCase] = useState<string>(useCaseOptions[0]);
  const [teamSize, setTeamSize] = useState<string>(teamSizeOptions[0]);
  const [industry, setIndustry] = useState<string>(industryOptions[0]);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentStep = steps[step];

  const parsedInviteEmails = useMemo(
    () =>
      inviteEmails
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [inviteEmails]
  );

  const routePostAuth = () => {
    if (initialPlan) {
      if (checkoutUrl) {
        persistPendingPlan(initialPlan);
        window.location.href = checkoutUrl;
        return;
      }

      router.push("/billing");
      return;
    }

    router.push("/account");
  };

  const continueToNextStep = () => {
    setError("");
    setSuccess("");

    if (
      step === 0 &&
      (!firstName || !lastName || !email || (accountMethod === "password" && !password))
    ) {
      setError("Complete your profile details before continuing.");
      return;
    }

    if (step === 1 && (!workspaceName || !useCase || !teamSize || !industry)) {
      setError("Complete your workspace details before continuing.");
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleCreateWorkspace = async (skipInvites = false) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const inviteList = skipInvites ? [] : parsedInviteEmails;

    try {
      if (accountMethod === "magic") {
        persistPendingOnboarding({
          email,
          firstName,
          lastName,
          workspaceName,
          useCase,
          teamSize,
          industry,
          inviteEmails: inviteList,
          inviteRole
        });

        const magicResponse = await fetch("/api/auth/magic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            createUser: true,
            firstName,
            lastName
          })
        });
        const magicJson = (await magicResponse.json()) as {
          success: boolean;
          error?: string;
        };

        if (!magicResponse.ok || !magicJson.success) {
          throw new Error(magicJson.error || "Unable to send magic access.");
        }

        setSuccess("Magic access sent. Finish account creation from your inbox.");
        const authUrl = new URL("/auth", window.location.origin);
        authUrl.searchParams.set("view", "magic");
        authUrl.searchParams.set("email", email);
        if (initialPlan) {
          authUrl.searchParams.set("plan", initialPlan);
        }
        router.push(`${authUrl.pathname}?${authUrl.searchParams.toString()}`);
        return;
      }

      const signupResponse = await fetch("/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "signup",
          email,
          password,
          firstName,
          lastName,
          workspaceName,
          useCase,
          teamSize,
          industry,
          inviteEmails: inviteList,
          inviteRole
        })
      });
      const signupJson = (await signupResponse.json()) as {
        success: boolean;
        session?: AuthSession | null;
        user?: { id: string; email: string } | null;
        emailConfirmationRequired?: boolean;
        error?: string;
      };

      if (!signupResponse.ok || !signupJson.success) {
        throw new Error(signupJson.error || "Unable to create your account.");
      }

      if (signupJson.session) {
        await setSession(signupJson.session);
        const bootstrapResponse = await fetch("/api/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${signupJson.session.access_token}`
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            workspaceName,
            useCase,
            teamSize,
            industry,
            inviteEmails: inviteList,
            inviteRole
          })
        });
        const bootstrapJson = (await bootstrapResponse.json()) as {
          success: boolean;
          error?: string;
        };

        if (!bootstrapResponse.ok || !bootstrapJson.success) {
          throw new Error(bootstrapJson.error || "Unable to initialize your workspace.");
        }
        routePostAuth();
        return;
      }

      setSuccess(
        "Account created. Check your inbox to confirm access, then return to continue."
      );
      const authUrl = new URL("/auth", window.location.origin);
      authUrl.searchParams.set("view", "signin");
      authUrl.searchParams.set("email", email);
      if (initialPlan) {
        authUrl.searchParams.set("plan", initialPlan);
      }
      router.push(`${authUrl.pathname}?${authUrl.searchParams.toString()}`);
    } catch (onboardingError) {
      const message =
        onboardingError instanceof Error
          ? onboardingError.message
          : "Unable to create your workspace.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepFields = () => {
    if (step === 0) {
      return (
        <div className="grid gap-4">
          {magicAccessEnabled ? (
            <>
              <Button
                className="auth-provider-button !min-h-[2.8rem]"
                disabled={loading}
                onClick={() => setAccountMethod("magic")}
                type="button"
                variant={accountMethod === "magic" ? "default" : "outline"}
              >
                <span className="auth-provider-inner">
                  <Mail className="auth-provider-svg h-4 w-4" />
                  Magic Access
                </span>
              </Button>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <div className="auth-divider-label">
                  <span>or</span>
                </div>
              </div>
            </>
          ) : null}

          <div className="onboarding-owner-copy-stack">
            <p className="auth-copy !max-w-none !text-left">
              Create an account with email and password.
            </p>
          </div>

          <div className="onboarding-owner-grid">
            <div className="auth-field onboarding-field-unit">
              <label className={labelClassName} htmlFor="onboarding-first-name">
                First Name
              </label>
              <Input
                id="onboarding-first-name"
                className={inputClassName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jane"
                value={firstName}
              />
            </div>

            <div className="auth-field onboarding-field-unit">
              <label className={labelClassName} htmlFor="onboarding-last-name">
                Last Name
              </label>
              <Input
                id="onboarding-last-name"
                className={inputClassName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Doe"
                value={lastName}
              />
            </div>

            <div className="auth-field onboarding-field-unit onboarding-grid-full">
              <label className={labelClassName} htmlFor="onboarding-email">
                Work Email
              </label>
              <Input
                id="onboarding-email"
                className={inputClassName}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@workspace.com"
                type="email"
                value={email}
              />
            </div>

            <div className="auth-field onboarding-field-unit onboarding-grid-full">
              <label className={labelClassName} htmlFor="onboarding-password">
                Password
              </label>
              <Input
                id="onboarding-password"
                className={inputClassName}
                disabled={accountMethod === "magic"}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  accountMethod === "magic" ? "Not required for magic access" : "••••••••"
                }
                type="password"
                value={password}
              />
            </div>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="onboarding-context-grid">
          <div className="auth-field onboarding-field-unit onboarding-grid-full">
            <label className={labelClassName} htmlFor="workspace-name">
              Workspace Name
            </label>
            <Input
              id="workspace-name"
              className={inputClassName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Intent workspace"
              value={workspaceName}
            />
          </div>

          <div className="auth-field onboarding-field-unit">
            <label className={labelClassName} htmlFor="workspace-use-case">
              Primary Use Case
            </label>
            <select
              id="workspace-use-case"
              className={selectClassName}
              onChange={(event) => setUseCase(event.target.value)}
              value={useCase}
            >
              {useCaseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field onboarding-field-unit">
            <label className={labelClassName} htmlFor="workspace-team-size">
              Team Size
            </label>
            <select
              id="workspace-team-size"
              className={selectClassName}
              onChange={(event) => setTeamSize(event.target.value)}
              value={teamSize}
            >
              {teamSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field onboarding-field-unit onboarding-grid-full">
            <label className={labelClassName} htmlFor="workspace-industry">
              Industry
            </label>
            <select
              id="workspace-industry"
              className={selectClassName}
              onChange={(event) => setIndustry(event.target.value)}
              value={industry}
            >
              {industryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="auth-field onboarding-field-unit">
          <label className={labelClassName} htmlFor="invite-emails">
            Invite Emails
          </label>
          <textarea
            id="invite-emails"
            className={textareaClassName}
            onChange={(event) => setInviteEmails(event.target.value)}
            placeholder="name@company.com, strategist@company.com"
            value={inviteEmails}
          />
        </div>

        <div className="onboarding-invite-grid">
          <div className="auth-field onboarding-field-unit">
            <label className={labelClassName} htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className={selectClassName}
              onChange={(event) => setInviteRole(event.target.value)}
              value={inviteRole}
            >
              <option value="member">Member</option>
              <option value="strategist">Strategist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button
            className="auth-provider-button !min-h-[2.8rem] !px-5"
            onClick={() => void handleCreateWorkspace(true)}
            type="button"
            variant="outline"
          >
            Skip for Now
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="onboarding-layout">
      <div className="onboarding-back-row">
        <Link
          className="auth-inline-link onboarding-back-link"
          href={initialPlan ? `/auth?plan=${initialPlan}` : "/auth"}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.28 }}
        className="w-full"
      >
        <div className="auth-card gap-6">
          <div className="onboarding-card-inner grid gap-6">
            <div className="auth-header !gap-3">
              <p className="auth-plan-pill">{currentStep.eyebrow}</p>
              <h1 className="auth-title normal-case not-italic">{currentStep.title}</h1>
              <p className="auth-copy !max-w-[24rem]">{currentStep.supporting}</p>
              <p className="auth-copy !max-w-[24rem]">{currentStep.instruction}</p>
            </div>

            <div className="grid gap-3">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index <= step ? "bg-zinc-100" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <div className="auth-divider">
                <div className="auth-divider-line" />
              </div>
            </div>

            <div className="onboarding-owner-section">
              <div className="onboarding-owner-section-head text-left">
                <p className={labelClassName}>{currentStep.sectionLabel}</p>
                <p className="auth-copy !max-w-none !text-left">{currentStep.sectionHelper}</p>
              </div>

              {renderStepFields()}
            </div>

            {error ? <p className="auth-message auth-message-error">{error}</p> : null}
            {success ? <p className="auth-message auth-message-success">{success}</p> : null}

            <div className="onboarding-actions">
              {step === 0 ? (
                <Link
                  className="auth-inline-link inline-flex items-center gap-2"
                  href={initialPlan ? `/auth?plan=${initialPlan}` : "/auth"}
                >
                  Cancel
                </Link>
              ) : (
                <button
                  className="auth-inline-link onboarding-back-link"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              )}

              {step < steps.length - 1 ? (
                <Button
                  className="auth-primary-button onboarding-primary-action !min-h-[2.8rem]"
                  disabled={loading}
                  onClick={continueToNextStep}
                >
                  Continue
                  <ArrowRight className="auth-button-arrow" />
                </Button>
              ) : (
                <Button
                  className="auth-primary-button onboarding-primary-action !min-h-[2.8rem]"
                  disabled={loading}
                  onClick={() => void handleCreateWorkspace(false)}
                >
                  {loading
                    ? accountMethod === "magic"
                      ? "Sending..."
                      : "Creating..."
                    : "Create Workspace"}
                  <ArrowRight className="auth-button-arrow" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

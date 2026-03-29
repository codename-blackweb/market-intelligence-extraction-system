"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import OrbitsBackground from "@/components/background/OrbitsBackground";
import { useAuth } from "@/components/providers/AuthProvider";

const steps = [
  "Your Profile",
  "Workspace",
  "Invite Team"
] as const;

const stepDescriptions = [
  "Set the owner identity for this workspace.",
  "Define the context so the output is tailored from the start.",
  "Add collaborators now or keep it personal for the first run."
] as const;

const useCaseOptions = [
  "Founder / Product Validation",
  "Marketing Strategy",
  "Agency Research",
  "Competitive Intelligence",
  "Messaging / Positioning"
];

const teamSizeOptions = [
  "Just me",
  "2-5",
  "6-15",
  "16-50",
  "50+"
];

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

const fieldLabelClass = "text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500";

const fieldInputClass =
  "h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 font-semibold text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/30 focus:ring-0 [color-scheme:dark]";

const fieldTextareaClass =
  "min-h-[160px] w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 font-semibold text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/30 focus:ring-0";

const secondaryActionClass =
  "inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100";

const primaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-950 shadow-[0_18px_42px_rgba(255,255,255,0.12)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60";

export default function WorkspaceOnboarding({
  initialEmail = ""
}: {
  initialEmail?: string;
}) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [useCase, setUseCase] = useState(useCaseOptions[0]);
  const [teamSize, setTeamSize] = useState(teamSizeOptions[0]);
  const [industry, setIndustry] = useState(industryOptions[0]);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parsedInviteEmails = useMemo(
    () =>
      inviteEmails
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [inviteEmails]
  );

  const continueToNextStep = () => {
    setError("");

    if (step === 0 && (!firstName || !lastName || !email || !password)) {
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

    try {
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
          lastName
        })
      });
      const signupJson = (await signupResponse.json()) as {
        success: boolean;
        session?: Parameters<typeof setSession>[0];
        user?: { id: string; email: string } | null;
        emailConfirmationRequired?: boolean;
        error?: string;
      };

      if (!signupResponse.ok || !signupJson.success) {
        throw new Error(signupJson.error || "Unable to create your account.");
      }

      const userId = signupJson.session?.user.id ?? signupJson.user?.id;

      if (!userId) {
        throw new Error("Unable to initialize your workspace user.");
      }

      const onboardingResponse = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          email,
          firstName,
          lastName,
          workspaceName,
          useCase,
          teamSize,
          industry,
          inviteEmails: skipInvites ? [] : parsedInviteEmails,
          inviteRole
        })
      });
      const onboardingJson = (await onboardingResponse.json()) as {
        success: boolean;
        error?: string;
      };

      if (!onboardingResponse.ok || !onboardingJson.success) {
        throw new Error(onboardingJson.error || "Unable to create your workspace.");
      }

      if (signupJson.session) {
        setSession(signupJson.session);
        router.push("/account");
        return;
      }

      setSuccess("Account created. Check your inbox to confirm access, then return to continue.");
      router.push(`/auth?view=signin&email=${encodeURIComponent(email)}`);
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

  return (
    <section className="auth-page">
      <OrbitsBackground
        accentColors={["#ffffff", "#67e8f9", "#facc15", "#f87171", "#a3e635"]}
        className="opacity-58"
        count={6}
        speed={1.08}
      />
      <div className="auth-page-glow auth-page-glow-left" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-right" aria-hidden="true" />

      <div className="auth-page-center px-4">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.4 }}
          className="relative mx-auto min-w-0 w-full max-w-[52rem]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-3.5rem] rounded-[3rem] blur-3xl"
            style={{ background: "rgba(3, 7, 18, 0.72)" }}
          />
          <div
            className="relative grid min-w-0 gap-7 overflow-hidden rounded-[2rem] border border-white/12 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.52)] backdrop-blur-[20px] md:p-8"
            style={{ background: "rgba(6, 8, 12, 0.985)" }}
          >
            <div className="grid justify-items-center gap-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                Workspace Setup
              </p>
              <h1 className="max-w-[14rem] px-2 text-[clamp(1.12rem,4.1vw,1.45rem)] font-black leading-[1.1] tracking-tight text-zinc-100 md:max-w-[34rem] md:px-0 md:text-[clamp(2.25rem,4vw,3.35rem)]">
                Create your account to start turning live demand signals into usable strategic
                direction.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-zinc-400">
                Set up your profile, define the workspace context, and invite collaborators only if
                you need them.
              </p>
              <Link className={secondaryActionClass} href="/auth">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {steps.map((stepLabel, index) => {
                const isActive = index === step;
                const isComplete = index < step;

                return (
                  <div
                    key={stepLabel}
                    className={`rounded-[1.4rem] border px-4 py-4 transition-colors ${
                      isActive
                        ? "border-white/75 bg-white text-zinc-950 shadow-[0_14px_34px_rgba(255,255,255,0.12)]"
                        : isComplete
                          ? "border-emerald-400/35 bg-emerald-400/10 text-zinc-100"
                          : "border-white/10 text-zinc-400"
                    }`}
                    style={!isActive && !isComplete ? { background: "rgba(255,255,255,0.03)" } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-current/20 text-sm font-black">
                        {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                          Step {index + 1}
                        </p>
                        <p className="mt-1 text-sm font-black">{stepLabel}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="mx-auto min-w-0 w-full max-w-[39rem] rounded-[1.6rem] border border-white/10 p-5 md:p-6"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <motion.div
                key={step}
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 14 }}
                transition={{ duration: 0.3 }}
                className="grid gap-5"
              >
                <div className="grid gap-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Step {step + 1} of {steps.length}
                  </p>
                  <p className="max-w-lg text-sm leading-6 text-zinc-400">{stepDescriptions[step]}</p>
                </div>

                {step === 0 ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className={fieldLabelClass}>First Name</span>
                      <input
                        className={fieldInputClass}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="Jane"
                        value={firstName}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={fieldLabelClass}>Last Name</span>
                      <input
                        className={fieldInputClass}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Doe"
                        value={lastName}
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className={fieldLabelClass}>Work Email</span>
                      <input
                        className={fieldInputClass}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="team@workspace.com"
                        type="email"
                        value={email}
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className={fieldLabelClass}>Password</span>
                      <input
                        className={fieldInputClass}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Create a secure password"
                        type="password"
                        value={password}
                      />
                    </label>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className={fieldLabelClass}>Workspace Name</span>
                      <input
                        className={fieldInputClass}
                        onChange={(event) => setWorkspaceName(event.target.value)}
                        placeholder="Intent workspace"
                        value={workspaceName}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={fieldLabelClass}>Primary Use Case</span>
                      <select
                        className={fieldInputClass}
                        onChange={(event) => setUseCase(event.target.value)}
                        value={useCase}
                      >
                        {useCaseOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className={fieldLabelClass}>Team Size</span>
                      <select
                        className={fieldInputClass}
                        onChange={(event) => setTeamSize(event.target.value)}
                        value={teamSize}
                      >
                        {teamSizeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className={fieldLabelClass}>Industry / Market</span>
                      <select
                        className={fieldInputClass}
                        onChange={(event) => setIndustry(event.target.value)}
                        value={industry}
                      >
                        {industryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className={fieldLabelClass}>Invite Emails</span>
                      <textarea
                        className={fieldTextareaClass}
                        onChange={(event) => setInviteEmails(event.target.value)}
                        placeholder="name@company.com, strategist@company.com"
                        value={inviteEmails}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={fieldLabelClass}>Role</span>
                      <select
                        className={fieldInputClass}
                        onChange={(event) => setInviteRole(event.target.value)}
                        value={inviteRole}
                      >
                        <option value="member">Member</option>
                        <option value="strategist">Strategist</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <div
                      className="rounded-2xl border border-white/10 p-4 text-sm leading-6 text-zinc-400"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      Step 3 is optional. If you skip it, we’ll create a personal workspace and
                      you can invite teammates later.
                    </div>
                  </div>
                ) : null}
              </motion.div>

              {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
              {success ? <p className="mt-6 text-sm text-emerald-300">{success}</p> : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                {step > 0 ? (
                  <button
                    className={secondaryActionClass}
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <Link className={secondaryActionClass} href="/auth">
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </Link>
                )}

                {step < steps.length - 1 ? (
                  <button className={primaryActionClass} onClick={continueToNextStep} type="button">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className={secondaryActionClass}
                      onClick={() => void handleCreateWorkspace(true)}
                      type="button"
                    >
                      Skip for Now
                    </button>
                    <button
                      className={primaryActionClass}
                      disabled={loading}
                      onClick={() => void handleCreateWorkspace(false)}
                      type="button"
                    >
                      {loading ? "Creating..." : "Create Workspace"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

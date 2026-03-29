"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import KineticFlowBg from "@/components/background/KineticFlowBg";
import { useAuth } from "@/components/providers/AuthProvider";

const steps = [
  "Your Profile",
  "Workspace",
  "Invite Team"
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
  "h-12 w-full rounded-2xl border border-white/12 bg-[#070b13] px-4 font-semibold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition-colors focus:border-cyan-200/35 focus:bg-[#050910]";

const fieldTextareaClass =
  "min-h-[160px] w-full rounded-2xl border border-white/12 bg-[#070b13] px-4 py-3 font-semibold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition-colors focus:border-cyan-200/35 focus:bg-[#050910]";

const secondaryActionClass =
  "inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100";

const primaryActionClass =
  "inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-950 shadow-[0_18px_42px_rgba(255,255,255,0.12)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60";

const pageOverlayStyle = {
  background:
    "radial-gradient(circle at top, rgba(34,211,238,0.12), transparent 26%), radial-gradient(circle at 70% 20%, rgba(167,139,250,0.08), transparent 22%), linear-gradient(180deg, rgba(2,6,23,0.44), rgba(2,6,23,0.84))"
};

const cardShellStyle = {
  background: "rgba(10, 16, 25, 0.94)"
};

const fieldSurfaceStyle = {
  background: "#070b13"
};

const idleStepStyle = {
  background: "#0c1420"
};

export default function WorkspaceOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
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
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#04070d] px-4 py-12 text-zinc-100 sm:px-6 lg:px-8">
      <KineticFlowBg
        complexity={0.0028}
        flowSpeed={1.2}
        particleColors={["#67e8f9", "#7dd3fc", "#a78bfa", "#86efac"]}
        particleCount={900}
        trailOpacity={0.04}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={pageOverlayStyle}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1100px]">
        <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center gap-4 text-center md:mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
              Workspace Setup
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Create your account to start turning live demand signals into usable strategic
              direction.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">
              Set up your profile, define the workspace context, and invite collaborators only if
              you need them.
            </p>
          </div>
          <Link
            className={secondaryActionClass}
            href="/auth"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <div
          className="mx-auto max-w-[860px] rounded-[2rem] border border-white/14 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.72)] md:p-8"
          style={cardShellStyle}
        >
          <div className="mb-8 grid gap-3 md:grid-cols-3">
            {steps.map((stepLabel, index) => (
              <div
                className={`rounded-[1.4rem] border px-4 py-4 ${
                  index === step
                    ? "border-white/70 bg-white text-zinc-950 shadow-[0_16px_38px_rgba(255,255,255,0.12)]"
                    : index < step
                      ? "border-emerald-400/40 bg-emerald-400/10 text-zinc-100"
                      : "border-white/10 bg-[#0c1420] text-zinc-500"
                }`}
                key={stepLabel}
                style={index === step || index < step ? undefined : idleStepStyle}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                  Step {index + 1}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-current/20">
                    {index < step ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
                  </div>
                  <p className="text-sm font-black">{stepLabel}</p>
                </div>
              </div>
            ))}
          </div>

          <motion.div
            key={step}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-xl"
          >
            {step === 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className={fieldLabelClass}>First Name</span>
                  <input
                    className={fieldInputClass}
                    onChange={(event) => setFirstName(event.target.value)}
                    style={fieldSurfaceStyle}
                    value={firstName}
                  />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabelClass}>Last Name</span>
                  <input
                    className={fieldInputClass}
                    onChange={(event) => setLastName(event.target.value)}
                    style={fieldSurfaceStyle}
                    value={lastName}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className={fieldLabelClass}>Work Email</span>
                  <input
                    className={fieldInputClass}
                    onChange={(event) => setEmail(event.target.value)}
                    style={fieldSurfaceStyle}
                    type="email"
                    value={email}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className={fieldLabelClass}>Password</span>
                  <input
                    className={fieldInputClass}
                    onChange={(event) => setPassword(event.target.value)}
                    style={fieldSurfaceStyle}
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
                    style={fieldSurfaceStyle}
                    value={workspaceName}
                  />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabelClass}>Primary Use Case</span>
                  <select
                    className={fieldInputClass}
                    onChange={(event) => setUseCase(event.target.value)}
                    style={fieldSurfaceStyle}
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
                    style={fieldSurfaceStyle}
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
                    style={fieldSurfaceStyle}
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
                    style={fieldSurfaceStyle}
                    value={inviteEmails}
                  />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabelClass}>Role</span>
                  <select
                    className={fieldInputClass}
                    onChange={(event) => setInviteRole(event.target.value)}
                    style={fieldSurfaceStyle}
                    value={inviteRole}
                  >
                    <option value="member">Member</option>
                    <option value="strategist">Strategist</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <div
                  className="rounded-2xl border border-white/10 p-4 text-sm leading-6 text-zinc-400"
                  style={idleStepStyle}
                >
                  Step 3 is optional. If you skip it, we’ll create a personal workspace and
                  you can invite teammates later.
                </div>
              </div>
            ) : null}
          </motion.div>

          {error ? <p className="mx-auto mt-6 max-w-xl text-sm text-red-400">{error}</p> : null}
          {success ? (
            <p className="mx-auto mt-6 max-w-xl text-sm text-emerald-300">{success}</p>
          ) : null}

          <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-between gap-3">
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
              <Link
                className={secondaryActionClass}
                href="/auth"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
            )}

            {step < steps.length - 1 ? (
              <button
                className={primaryActionClass}
                onClick={continueToNextStep}
                type="button"
              >
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
    </section>
  );
}

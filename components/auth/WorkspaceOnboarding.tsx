"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
    <section className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
              Workspace Setup
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Create your account to start turning live demand signals into usable strategic
              direction.
            </h1>
          </div>
          <Link
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-zinc-100"
            href="/auth"
          >
            Back to Login
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            {steps.map((stepLabel, index) => (
              <div
                className={`rounded-2xl border px-4 py-4 ${
                  index === step
                    ? "border-white bg-white text-zinc-950"
                    : index < step
                      ? "border-emerald-400/40 bg-emerald-400/10 text-zinc-100"
                      : "border-white/10 bg-zinc-950 text-zinc-500"
                }`}
                key={stepLabel}
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
          >
            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    First Name
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setFirstName(event.target.value)}
                    value={firstName}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Last Name
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setLastName(event.target.value)}
                    value={lastName}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Work Email
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    value={email}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Password
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    value={password}
                  />
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Workspace Name
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    value={workspaceName}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Primary Use Case
                  </span>
                  <select
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
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
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Team Size
                  </span>
                  <select
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
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
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Industry / Market
                  </span>
                  <select
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Invite Emails
                  </span>
                  <textarea
                    className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setInviteEmails(event.target.value)}
                    placeholder="name@company.com, strategist@company.com"
                    value={inviteEmails}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                    Role
                  </span>
                  <select
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 font-semibold text-zinc-100 outline-none transition-colors focus:border-white/30"
                    onChange={(event) => setInviteRole(event.target.value)}
                    value={inviteRole}
                  >
                    <option value="member">Member</option>
                    <option value="strategist">Strategist</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-400">
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-300"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-300"
                href="/auth"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
            )}

            {step < steps.length - 1 ? (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-950"
                onClick={continueToNextStep}
                type="button"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-300"
                  onClick={() => void handleCreateWorkspace(true)}
                  type="button"
                >
                  Skip for Now
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-950"
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

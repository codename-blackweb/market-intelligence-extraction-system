"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Building,
  Camera,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  User
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountSummaryResponse, UserPlan } from "@/types/market-analysis";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  workEmail: string;
  workspaceName: string;
  primaryUseCase: string;
  teamSize: string;
  industry: string;
  summary: string;
};

const emptyProfileState: ProfileFormState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  workspaceName: "",
  primaryUseCase: "",
  teamSize: "",
  industry: "",
  summary: ""
};

function formatPlan(plan: UserPlan) {
  if (plan === "agency") {
    return "Agency";
  }

  if (plan === "pro") {
    return "Pro";
  }

  return "Free";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildSummary(state: {
  workspaceName?: string | null;
  primaryUseCase?: string | null;
  teamSize?: string | null;
  industry?: string | null;
}) {
  const workspace = state.workspaceName?.trim() || "This workspace";
  const useCase = state.primaryUseCase?.trim() || "demand intelligence work";
  const team = state.teamSize?.trim() || "a lean team";
  const industry = state.industry?.trim() || "general market research";

  return `${workspace} is configured for ${useCase}, operating across ${industry}, with ${team} shaping analysis and strategy.`;
}

async function fetchAccountSummary(accessToken: string) {
  const response = await fetch("/api/account", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const json = (await response.json()) as AccountSummaryResponse;

  if (!response.ok || !json.success) {
    throw new Error(json.error || "Unable to load account.");
  }

  return json;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function FieldShell({
  icon: Icon,
  children
}: {
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      {children}
    </div>
  );
}

export default function LightswindAccountProfile() {
  const { isAuthenticated, isReady, session } = useAuth();
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [formState, setFormState] = useState<ProfileFormState>(emptyProfileState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setLoading(true);
        const nextSummary = await fetchAccountSummary(session.access_token);

        if (!isMounted) {
          return;
        }

        setSummary(nextSummary);
        setFormState({
          firstName: nextSummary.profile?.first_name ?? session.user.first_name ?? "",
          lastName: nextSummary.profile?.last_name ?? session.user.last_name ?? "",
          workEmail: nextSummary.profile?.work_email ?? session.user.email ?? "",
          workspaceName: nextSummary.workspace?.name ?? "",
          primaryUseCase: nextSummary.workspace?.primary_use_case ?? "",
          teamSize: nextSummary.workspace?.team_size ?? "",
          industry: nextSummary.workspace?.industry ?? "",
          summary: buildSummary({
            workspaceName: nextSummary.workspace?.name,
            primaryUseCase: nextSummary.workspace?.primary_use_case,
            teamSize: nextSummary.workspace?.team_size,
            industry: nextSummary.workspace?.industry
          })
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load account.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isReady, session?.access_token, session?.user.email, session?.user.first_name, session?.user.last_name]);

  const displayName = useMemo(() => {
    const fullName = `${formState.firstName} ${formState.lastName}`.trim();
    return fullName || session?.user.full_name || "Workspace User";
  }, [formState.firstName, formState.lastName, session?.user.full_name]);

  const subtitle = useMemo(() => {
    const workspaceName = formState.workspaceName.trim() || "your workspace";
    return `Workspace owner at ${workspaceName}`;
  }, [formState.workspaceName]);

  const completionPercent = useMemo(() => {
    const fields = [
      formState.firstName,
      formState.lastName,
      formState.workEmail,
      formState.workspaceName,
      formState.primaryUseCase,
      formState.teamSize,
      formState.industry
    ];
    return Math.round((fields.filter((value) => value.trim()).length / fields.length) * 100);
  }, [
    formState.firstName,
    formState.industry,
    formState.lastName,
    formState.primaryUseCase,
    formState.teamSize,
    formState.workEmail,
    formState.workspaceName
  ]);

  const planLabel = summary?.usage?.plan ?? summary?.subscription?.plan ?? "free";
  const statusText = summary?.subscription?.status || "active";
  const sidebarStatusCopy =
    planLabel === "agency"
      ? "Agency features are active on this workspace. Use Billing to manage the plan and team delivery controls."
      : planLabel === "pro"
        ? "Pro is active on this workspace. Billing and persisted usage are connected to your Supabase account."
        : "Free plan is active. Billing and persisted account state are connected and ready when you need to upgrade.";

  const handleSave = async () => {
    if (!session?.access_token) {
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          email: formState.workEmail.trim(),
          workspaceName: formState.workspaceName.trim(),
          useCase: formState.primaryUseCase.trim(),
          teamSize: formState.teamSize.trim(),
          industry: formState.industry.trim()
        })
      });
      const json = (await response.json()) as AccountSummaryResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to save changes.");
      }

      setSummary(json);
      setSuccess("Changes saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
            Account Access
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign in to access your workspace.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Your workspace settings and billing state are attached to your authenticated account.
          </p>
          <Link
            className="mt-8 inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-6 text-xs font-bold uppercase tracking-[0.18em] text-white dark:bg-zinc-100 dark:text-zinc-900"
            href="/auth"
          >
            Continue to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl p-4 md:p-8"
        initial={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.3 }}
      >
        <div className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="relative h-48 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_34%)]" />
            <button
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/30"
              type="button"
            >
              <Camera className="h-4 w-4" />
              Change Cover
            </button>
          </div>

          <div className="px-8 pb-8">
            <div className="relative z-10 -mt-16 mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end">
              <div className="group relative cursor-pointer">
                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[32px] border-4 border-white bg-zinc-100 object-cover shadow-lg dark:border-zinc-950 dark:bg-zinc-900">
                  <span className="text-4xl font-black text-zinc-300 dark:text-zinc-700">
                    {getInitials(displayName)}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="mb-2 flex-1 text-center sm:text-left">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {formatPlan(planLabel)}
                  </span>
                  <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {statusText}
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {displayName}
                </h2>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{subtitle}</p>
              </div>

              <div className="mb-2">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-6 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  href="/workspace"
                >
                  View Workspace
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                Loading workspace profile...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
                <div className="space-y-8 md:col-span-8">
                  <div>
                    <h3 className="mb-4 text-lg font-black text-zinc-900 dark:text-zinc-100">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel htmlFor="account-first-name">First Name</FieldLabel>
                        <FieldShell icon={User}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="account-first-name"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, firstName: event.target.value }))
                            }
                            value={formState.firstName}
                          />
                        </FieldShell>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel htmlFor="account-last-name">Last Name</FieldLabel>
                        <FieldShell icon={User}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="account-last-name"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, lastName: event.target.value }))
                            }
                            value={formState.lastName}
                          />
                        </FieldShell>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <FieldLabel htmlFor="account-email">Email Address</FieldLabel>
                        <FieldShell icon={Mail}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="account-email"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, workEmail: event.target.value }))
                            }
                            type="email"
                            value={formState.workEmail}
                          />
                        </FieldShell>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <FieldLabel htmlFor="account-summary">Short Bio</FieldLabel>
                        <textarea
                          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                          id="account-summary"
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, summary: event.target.value }))
                          }
                          rows={4}
                          value={formState.summary}
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-800" />

                  <div>
                    <h3 className="mb-4 text-lg font-black text-zinc-900 dark:text-zinc-100">
                      Professional Details
                    </h3>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel htmlFor="workspace-name">Workspace Name</FieldLabel>
                        <FieldShell icon={Building}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="workspace-name"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, workspaceName: event.target.value }))
                            }
                            value={formState.workspaceName}
                          />
                        </FieldShell>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel htmlFor="workspace-team-size">Team Size</FieldLabel>
                        <FieldShell icon={MapPin}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="workspace-team-size"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, teamSize: event.target.value }))
                            }
                            value={formState.teamSize}
                          />
                        </FieldShell>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <FieldLabel htmlFor="workspace-use-case">Primary Use Case</FieldLabel>
                        <FieldShell icon={Globe}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="workspace-use-case"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, primaryUseCase: event.target.value }))
                            }
                            value={formState.primaryUseCase}
                          />
                        </FieldShell>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <FieldLabel htmlFor="workspace-industry">Industry</FieldLabel>
                        <FieldShell icon={Globe}>
                          <Input
                            className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                            id="workspace-industry"
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, industry: event.target.value }))
                            }
                            value={formState.industry}
                          />
                        </FieldShell>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      className="h-12 rounded-xl bg-indigo-500 px-8 font-bold text-white shadow-md transition-all hover:bg-indigo-600"
                      disabled={isSaving}
                      onClick={() => void handleSave()}
                    >
                      {isSaving ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 md:col-span-4">
                  <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="mb-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        Profile Completeness
                      </h4>
                    </div>
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {completionPercent}% Complete. Finish the owner and workspace fields to reach
                      100%.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                    <div className="mb-2 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-indigo-500" />
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-100">
                        Account Status
                      </h4>
                    </div>
                    <p className="mb-4 text-xs font-medium leading-6 text-indigo-700/80 dark:text-indigo-300">
                      {sidebarStatusCopy}
                    </p>
                    <Button
                      className="h-10 w-full rounded-xl border-indigo-200 bg-white text-xs font-bold text-indigo-700 shadow-none hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-zinc-950 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                      onClick={() => {
                        window.location.href = "/billing";
                      }}
                      variant="outline"
                    >
                      Open Billing
                    </Button>
                  </div>

                  {error ? (
                    <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                      {error}
                    </div>
                  ) : null}

                  {success ? (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {success}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}

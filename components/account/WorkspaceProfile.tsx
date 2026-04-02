"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FolderKanban,
  Link2,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  persistPendingAnalysisRestore,
  persistPendingPlan,
  persistStoredPlan
} from "@/lib/client-identity";
import { cn } from "@/lib/utils";
import type {
  AccountSummaryResponse,
  UserPlan
} from "@/types/market-analysis";

const tabs = ["Workspace", "Analyses", "Reports", "Billing"] as const;
type WorkspaceProfileTab = (typeof tabs)[number];

const CHECKOUT_URL = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";
const PORTAL_URL = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || "";

const sectionCardClass =
  "rounded-[1.6rem] border border-zinc-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[rgba(17,17,20,0.82)] dark:shadow-none";
const sidebarCardClass =
  "rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/85 p-5 dark:border-white/10 dark:bg-[rgba(12,12,14,0.92)]";
const statCardClass =
  "rounded-[1.35rem] border border-zinc-200/70 bg-white/88 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[rgba(17,17,20,0.82)] dark:shadow-none";
const labelClass =
  "text-[0.66rem] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500";
const inputClassName =
  "h-12 rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 text-[0.95rem] font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-0 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-white/25";
const textareaClassName =
  "min-h-[120px] w-full rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-[0.95rem] font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-0 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-white/25";
const selectClassName =
  "h-12 w-full rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 text-[0.95rem] font-medium text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-0 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-100 dark:focus:border-white/25";

function formatPlan(plan: UserPlan) {
  if (plan === "agency") {
    return "Agency";
  }

  if (plan === "pro") {
    return "Pro";
  }

  return "Free";
}

function formatDate(value?: string) {
  if (!value) {
    return "Recently";
  }

  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Recently";
  }

  return new Date(value).toLocaleString();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRoleLabel(role: string) {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "admin") {
    return "Admin";
  }

  if (role === "strategist") {
    return "Strategist";
  }

  return "Member";
}

function isFilled(value?: string | null) {
  return Boolean(value && value.trim());
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
    throw new Error(json.error || "Unable to load workspace.");
  }

  return json;
}

function FieldGroup({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={statCardClass}>
      <p className={labelClass}>{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function SidebarCard({
  icon: Icon,
  eyebrow,
  title,
  copy,
  accent = "default",
  children
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  copy: string;
  accent?: "default" | "success" | "brand";
  children?: ReactNode;
}) {
  const accentClasses =
    accent === "success"
      ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10"
      : accent === "brand"
        ? "border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-400/10"
        : "border-zinc-200/80 bg-zinc-50/85 dark:border-white/10 dark:bg-[rgba(12,12,14,0.92)]";

  const iconClasses =
    accent === "success"
      ? "text-emerald-600 dark:text-emerald-300"
      : accent === "brand"
        ? "text-sky-600 dark:text-sky-300"
        : "text-zinc-500 dark:text-zinc-300";

  return (
    <div className={cn(sidebarCardClass, accentClasses)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-current/15 bg-white/70 dark:bg-white/5">
          <Icon className={cn("h-5 w-5", iconClasses)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={labelClass}>{eyebrow}</p>
          <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-100">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{copy}</p>
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

type SettingsFormState = {
  firstName: string;
  lastName: string;
  workEmail: string;
  workspaceName: string;
  primaryUseCase: string;
  teamSize: string;
  industry: string;
};

const emptySettingsForm: SettingsFormState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  workspaceName: "",
  primaryUseCase: "",
  teamSize: "",
  industry: ""
};

export default function WorkspaceProfile({
  initialTab = "Workspace"
}: {
  initialTab?: WorkspaceProfileTab;
}) {
  const { isAuthenticated, isReady, plan, session, setPlan, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceProfileTab>(initialTab);
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [settings, setSettings] = useState<SettingsFormState>(emptySettingsForm);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteSaving, setInviteSaving] = useState(false);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const inviteInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session?.user.id || !session.access_token) {
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

        const nextPlan =
          nextSummary.usage?.plan ??
          (nextSummary.subscription?.plan === "pro" || nextSummary.subscription?.plan === "agency"
            ? nextSummary.subscription.plan
            : "free");

        setPlan(nextPlan);
        persistStoredPlan(nextPlan);
      } catch (summaryError) {
        if (isMounted) {
          const message =
            summaryError instanceof Error ? summaryError.message : "Unable to load workspace.";
          setError(message);
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
  }, [isReady, session?.access_token, session?.user.id, setPlan]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSettings({
      firstName: summary?.profile?.first_name ?? session?.user.first_name ?? "",
      lastName: summary?.profile?.last_name ?? session?.user.last_name ?? "",
      workEmail: summary?.profile?.work_email ?? session?.user.email ?? "",
      workspaceName: summary?.workspace?.name ?? "",
      primaryUseCase: summary?.workspace?.primary_use_case ?? "",
      teamSize: summary?.workspace?.team_size ?? "",
      industry: summary?.workspace?.industry ?? ""
    });
  }, [
    session?.user.email,
    session?.user.first_name,
    session?.user.last_name,
    summary?.profile?.first_name,
    summary?.profile?.last_name,
    summary?.profile?.work_email,
    summary?.workspace?.industry,
    summary?.workspace?.name,
    summary?.workspace?.primary_use_case,
    summary?.workspace?.team_size
  ]);

  const analyses = summary?.analyses ?? [];
  const members = summary?.members ?? [];
  const invites = summary?.invites ?? [];
  const activeMembers = members.filter((member) => !member.invited_email && member.status === "active");
  const usage = summary?.usage;
  const profilePlan = usage?.plan ?? summary?.subscription?.plan ?? plan;
  const profileName =
    summary?.profile
      ? `${summary.profile.first_name} ${summary.profile.last_name}`.trim()
      : "";
  const displayName = profileName || session?.user.full_name || "Workspace User";
  const workspaceName = summary?.workspace?.name || "Personal Workspace";
  const joinedDate = summary?.profile?.created_at ?? session?.user.created_at;
  const workEmail = summary?.profile?.work_email || session?.user.email || "";
  const sharedReportEntries = analyses
    .filter((analysis) => Boolean(analysis.shared_report))
    .map((analysis) => ({
      analysis,
      report: analysis.shared_report,
      shareUrl: `/analysis/${analysis.id}`
    }));

  const completionChecks = [
    isFilled(settings.firstName),
    isFilled(settings.lastName),
    isFilled(settings.workEmail),
    isFilled(settings.workspaceName),
    isFilled(settings.primaryUseCase),
    isFilled(settings.teamSize),
    isFilled(settings.industry)
  ];
  const completionPercent = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100
  );
  const missingSetupItems = [
    !isFilled(settings.workspaceName) ? "workspace name" : null,
    !isFilled(settings.primaryUseCase) ? "primary use case" : null,
    !isFilled(settings.teamSize) ? "team size" : null,
    !isFilled(settings.industry) ? "industry" : null
  ].filter(Boolean) as string[];

  const billingCopy = useMemo(() => {
    if (profilePlan === "agency") {
      return "Agency unlocks multi-workspace delivery, team roles, and white-label report control.";
    }

    if (profilePlan === "pro") {
      return "Unlimited LIVE analyses, deep synthesis, competitor enrichment, and advanced generators are active.";
    }

    return "Free includes unlimited HYBRID work and 5 LIVE analyses each day. Upgrade when you need deeper synthesis and paid-only controls.";
  }, [profilePlan]);

  const usageFeatureRows = [
    {
      label: "Deep synthesis",
      enabled: Boolean(usage?.deep_synthesis_enabled)
    },
    {
      label: "Advanced generators",
      enabled: Boolean(usage?.generators_enabled)
    },
    {
      label: "Export",
      enabled: Boolean(usage?.export_enabled)
    },
    {
      label: "Competitor inputs",
      enabled: Boolean(usage?.competitor_inputs_enabled)
    }
  ];

  const analysisModes = analyses.reduce<Record<string, number>>((accumulator, analysis) => {
    const mode = analysis.result_json.source_meta.mode;
    accumulator[mode] = (accumulator[mode] ?? 0) + 1;
    return accumulator;
  }, {});

  const handleRestoreAnalysis = (analysisId: string) => {
    persistPendingAnalysisRestore(analysisId);
    window.location.href = "/#recent-analyses";
  };

  const handleCopyLink = async (analysisId: string) => {
    const url = `${window.location.origin}/analysis/${analysisId}`;

    try {
      await navigator.clipboard.writeText(url);
      setWorkspaceMessage("Public report link copied.");
    } catch {
      setWorkspaceMessage(url);
    }
  };

  const handleUpgrade = (nextPlan: Exclude<UserPlan, "free">) => {
    if (!CHECKOUT_URL) {
      setWorkspaceMessage("Billing checkout is not configured right now.");
      setActiveTab("Billing");
      return;
    }

    persistPendingPlan(nextPlan);
    window.location.href = CHECKOUT_URL;
  };

  const handleInviteSubmit = async () => {
    if (!session?.access_token) {
      return;
    }

    const parsedEmails = inviteEmails
      .split(/[\n,]/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    if (!parsedEmails.length) {
      setWorkspaceMessage("Add at least one teammate email.");
      return;
    }

    setInviteSaving(true);
    setWorkspaceMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          inviteEmails: parsedEmails,
          inviteRole
        })
      });
      const json = (await response.json()) as AccountSummaryResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to add teammate invites.");
      }

      setSummary(json);
      if (json.usage?.plan) {
        setPlan(json.usage.plan);
        persistStoredPlan(json.usage.plan);
      }
      setInviteEmails("");
      setWorkspaceMessage("Invite saved.");
    } catch (inviteError) {
      const message =
        inviteError instanceof Error ? inviteError.message : "Unable to add teammate invites.";
      setWorkspaceMessage(message);
    } finally {
      setInviteSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!session?.access_token) {
      return;
    }

    if (!settings.workEmail.trim() || !settings.workspaceName.trim()) {
      setWorkspaceMessage("Work email and workspace name are required.");
      return;
    }

    setSavePending(true);
    setWorkspaceMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          firstName: settings.firstName.trim(),
          lastName: settings.lastName.trim(),
          email: settings.workEmail.trim(),
          workspaceName: settings.workspaceName.trim(),
          useCase: settings.primaryUseCase.trim(),
          teamSize: settings.teamSize.trim(),
          industry: settings.industry.trim()
        })
      });
      const json = (await response.json()) as AccountSummaryResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to save workspace settings.");
      }

      setSummary(json);
      if (json.usage?.plan) {
        setPlan(json.usage.plan);
        persistStoredPlan(json.usage.plan);
      }
      setWorkspaceMessage("Workspace settings saved.");
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Unable to save workspace settings.";
      setWorkspaceMessage(message);
    } finally {
      setSavePending(false);
    }
  };

  const focusInviteSection = () => {
    setActiveTab("Workspace");
    window.setTimeout(() => {
      inviteInputRef.current?.focus();
    }, 120);
  };

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-16 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-zinc-200/80 bg-white/95 p-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[rgba(9,9,12,0.92)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.48)]">
          <p className={labelClass}>Account Access</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
            Sign in to access your workspace.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Your saved analyses, billing state, shared reports, and workspace configuration live
            behind your account.
          </p>
          <Link
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-6 text-xs font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950"
            href="/auth"
          >
            Continue to Login
          </Link>
        </div>
      </main>
    );
  }

  const renderWorkspaceTab = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className={sectionCardClass}>
          <div className="mb-6">
            <p className={labelClass}>Owner Identity</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              Workspace owner settings
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Keep the owner record, recovery email, and workspace identity aligned to the person
              actually steering analyses and billing.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FieldGroup label="First Name">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, firstName: event.target.value }))
                }
                placeholder="Signal"
                value={settings.firstName}
              />
            </FieldGroup>
            <FieldGroup label="Last Name">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, lastName: event.target.value }))
                }
                placeholder="Owner"
                value={settings.lastName}
              />
            </FieldGroup>
            <FieldGroup className="md:col-span-2" label="Work Email">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, workEmail: event.target.value }))
                }
                placeholder="owner@workspace.com"
                type="email"
                value={settings.workEmail}
              />
            </FieldGroup>
          </div>
        </section>

        <section className={sectionCardClass}>
          <div className="mb-6">
            <p className={labelClass}>Workspace Context</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              Define the workspace operating context
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              These fields drive plan display, saved analysis labeling, and team context across
              the product.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FieldGroup className="md:col-span-2" label="Workspace Name">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, workspaceName: event.target.value }))
                }
                placeholder="SignalForge Strategy"
                value={settings.workspaceName}
              />
            </FieldGroup>
            <FieldGroup label="Primary Use Case">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, primaryUseCase: event.target.value }))
                }
                placeholder="Founder / Product Validation"
                value={settings.primaryUseCase}
              />
            </FieldGroup>
            <FieldGroup label="Team Size">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, teamSize: event.target.value }))
                }
                placeholder="2-5"
                value={settings.teamSize}
              />
            </FieldGroup>
            <FieldGroup className="md:col-span-2" label="Industry">
              <Input
                className={inputClassName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, industry: event.target.value }))
                }
                placeholder="Demand intelligence"
                value={settings.industry}
              />
            </FieldGroup>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              className="h-11 rounded-xl bg-zinc-950 px-6 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              disabled={savePending}
              onClick={() => void handleSaveSettings()}
            >
              {savePending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>

        <section className={sectionCardClass}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={labelClass}>Team Access</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                Members and invitations
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Keep workspace ownership clean, invite collaborators when you need them, and use
                roles to control who touches strategy operations.
              </p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              {activeMembers.length} active • {invites.length} pending
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_210px_auto]">
            <FieldGroup label="Invite Emails">
              <textarea
                className={textareaClassName}
                onChange={(event) => setInviteEmails(event.target.value)}
                placeholder="Enter email addresses (comma-separated)"
                ref={inviteInputRef}
                value={inviteEmails}
              />
            </FieldGroup>
            <FieldGroup label="Role">
              <select
                className={selectClassName}
                onChange={(event) => setInviteRole(event.target.value)}
                value={inviteRole}
              >
                <option value="member">Member</option>
                <option value="strategist">Strategist</option>
                <option value="admin">Admin</option>
              </select>
            </FieldGroup>
            <div className="flex items-end">
              <Button
                className="h-12 w-full rounded-xl bg-zinc-950 px-5 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                disabled={inviteSaving}
                onClick={() => void handleInviteSubmit()}
              >
                {inviteSaving ? "Saving..." : "Send Invite"}
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <p className={labelClass}>Active Members</p>
              {activeMembers.length ? (
                activeMembers.map((member) => {
                  const label =
                    member.user_id === summary?.profile?.id
                      ? displayName
                      : member.invited_email || "Workspace member";

                  return (
                    <div
                      className="flex items-center justify-between rounded-[1.15rem] border border-zinc-200/80 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]"
                      key={member.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                          {label}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{member.status}</p>
                      </div>
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-400">
                  No active members yet.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className={labelClass}>Pending Invites</p>
              {invites.length ? (
                invites.map((invite) => (
                  <div
                    className="flex items-center justify-between rounded-[1.15rem] border border-zinc-200/80 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]"
                    key={invite.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                        {invite.invited_email || "Pending invite"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{invite.status}</p>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                      {getRoleLabel(invite.role)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-400">
                  No pending team invites. This workspace is still personal.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <SidebarCard
          accent="success"
          copy={
            missingSetupItems.length
              ? `Complete ${missingSetupItems.join(", ")} to finish the workspace setup surface.`
              : "Owner identity and workspace context are fully set. This workspace is ready for persisted runs."
          }
          eyebrow="Setup Status"
          icon={CheckCircle2}
          title={`${completionPercent}% complete`}
        >
          <div className="h-2 overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </SidebarCard>

        <SidebarCard
          accent="brand"
          copy={billingCopy}
          eyebrow="Plan / Billing"
          icon={CreditCard}
          title={`${formatPlan(profilePlan)} plan`}
        >
          <div className="space-y-3">
            <div className="rounded-[1rem] border border-sky-200/80 bg-white/70 px-4 py-3 dark:border-sky-400/20 dark:bg-white/5">
              <p className={labelClass}>LIVE runs remaining today</p>
              <p className="mt-2 text-xl font-black text-zinc-950 dark:text-zinc-100">
                {typeof usage?.live_runs_remaining === "number" ? usage.live_runs_remaining : "Unlimited"}
              </p>
            </div>
            {profilePlan === "free" ? (
              <Button
                className="h-11 w-full rounded-xl bg-zinc-950 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                onClick={() => handleUpgrade("pro")}
              >
                Upgrade to Pro
              </Button>
            ) : PORTAL_URL ? (
              <Button
                className="h-11 w-full rounded-xl bg-zinc-950 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                onClick={() => {
                  window.location.href = PORTAL_URL;
                }}
              >
                Manage Billing
              </Button>
            ) : null}
          </div>
        </SidebarCard>

        <SidebarCard
          copy="Shared reports, invited collaborators, and saved analyses all resolve from the same live account record."
          eyebrow="Workspace Reach"
          icon={ShieldCheck}
          title="Live account state"
        >
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Saved analyses</span>
              <span className="font-black text-zinc-950 dark:text-zinc-100">
                {summary?.savedAnalysesCount ?? analyses.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Shared links</span>
              <span className="font-black text-zinc-950 dark:text-zinc-100">
                {summary?.sharedReportsCount ?? sharedReportEntries.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Members</span>
              <span className="font-black text-zinc-950 dark:text-zinc-100">{activeMembers.length}</span>
            </div>
          </div>
        </SidebarCard>
      </aside>
    </div>
  );

  const renderAnalysesTab = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className={sectionCardClass}>
          <div className="mb-6">
            <p className={labelClass}>Saved Analyses</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              Persisted market intelligence runs
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Restore previous runs into the engine without rerunning demand collection, or jump
              into the public view when a report has already been shared.
            </p>
          </div>

          {analyses.length ? (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  className="rounded-[1.35rem] border border-zinc-200/80 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]"
                  key={analysis.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                        {analysis.query}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                        {analysis.market_type || "No market context"} • {analysis.depth} •{" "}
                        {analysis.result_json.source_meta.mode}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      {formatDateTime(analysis.created_at)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {analysis.result_json.dominant_narrative}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      className="h-10 rounded-xl bg-zinc-950 px-4 text-[0.68rem] font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                      onClick={() => handleRestoreAnalysis(analysis.id)}
                    >
                      Restore in Engine
                    </Button>
                    {analysis.is_public ? (
                      <Link
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                        href={`/analysis/${analysis.id}`}
                      >
                        Open Shared View
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50/90 p-6 text-sm text-zinc-500 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-400">
              No saved analyses yet.
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <SidebarCard
          accent="success"
          copy="Every saved run is tied to the live workspace account and can be restored without rerunning acquisition analysis."
          eyebrow="Run Volume"
          icon={FolderKanban}
          title={`${summary?.savedAnalysesCount ?? analyses.length} saved analyses`}
        />
        <SidebarCard
          copy="Mode mix shows how much of your current history came from live collection versus hybrid or development runs."
          eyebrow="Mode Mix"
          icon={Sparkles}
          title="Acquisition coverage"
        >
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            {["LIVE", "HYBRID", "DEV"].map((mode) => (
              <div
                className="flex items-center justify-between rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                key={mode}
              >
                <span>{mode}</span>
                <span className="font-black text-zinc-950 dark:text-zinc-100">
                  {analysisModes[mode] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </SidebarCard>
      </aside>
    </div>
  );

  const renderReportsTab = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className={sectionCardClass}>
          <div className="mb-6">
            <p className={labelClass}>Shared Reports</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              Public and private share links
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Reports reflect real persisted analyses. Copy links when public sharing is enabled,
              or keep them private until the narrative is ready to circulate.
            </p>
          </div>

          {sharedReportEntries.length ? (
            <div className="space-y-4">
              {sharedReportEntries.map(({ analysis, report, shareUrl }) => (
                <div
                  className="rounded-[1.35rem] border border-zinc-200/80 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]"
                  key={analysis.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                        {analysis.query}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                        {report?.is_public ? "Public" : "Private"} • {formatDateTime(report?.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                      {report?.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button
                      className="h-10 rounded-xl bg-zinc-950 px-4 text-[0.68rem] font-black uppercase tracking-[0.16em] text-white hover:bg-black disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                      disabled={!report?.is_public}
                      onClick={() => void handleCopyLink(analysis.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </Button>
                    <Link
                      className={cn(
                        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[0.68rem] font-black uppercase tracking-[0.16em] dark:border-white/10 dark:bg-white/5",
                        report?.is_public
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "pointer-events-none text-zinc-400 dark:text-zinc-500"
                      )}
                      href={report?.is_public ? `/analysis/${analysis.id}` : "#"}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Link
                    </Link>
                  </div>
                  {report?.is_public ? (
                    <p className="mt-3 truncate text-xs text-zinc-500 dark:text-zinc-500">{shareUrl}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-zinc-200 bg-zinc-50/90 p-6 text-sm text-zinc-500 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)] dark:text-zinc-400">
              No shared reports yet. Public analyses will appear here automatically.
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <SidebarCard
          accent="brand"
          copy="Shared reports use persisted analysis state, so the dashboard and public report view stay tied to the same source of truth."
          eyebrow="Report Count"
          icon={Link2}
          title={`${summary?.sharedReportsCount ?? sharedReportEntries.length} report links`}
        />
        <SidebarCard
          copy="Private analyses stay inside the workspace. Public reports are available for copied links and direct review routes."
          eyebrow="Visibility"
          icon={ShieldCheck}
          title="Controlled distribution"
        >
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Public</span>
              <span className="font-black text-zinc-950 dark:text-zinc-100">
                {sharedReportEntries.filter((entry) => entry.report?.is_public).length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <span>Private</span>
              <span className="font-black text-zinc-950 dark:text-zinc-100">
                {sharedReportEntries.filter((entry) => !entry.report?.is_public).length}
              </span>
            </div>
          </div>
        </SidebarCard>
      </aside>
    </div>
  );

  const renderBillingTab = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className={sectionCardClass}>
          <div className="mb-6">
            <p className={labelClass}>Current Plan</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              {formatPlan(profilePlan)} plan status
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Real gating and feature access resolve from the live persisted subscription state.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.35rem] border border-zinc-200/80 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]">
              <p className={labelClass}>Subscription Status</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                {summary?.subscription?.status || "active"}
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{billingCopy}</p>
            </div>
            <div className="rounded-[1.35rem] border border-zinc-200/80 bg-zinc-50/90 p-5 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]">
              <p className={labelClass}>Usage Summary</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className={labelClass}>LIVE Analyses Today</p>
                  <p className="mt-2 text-xl font-black text-zinc-950 dark:text-zinc-100">
                    {usage?.live_runs_today ?? 0}
                    {typeof usage?.live_runs_limit === "number" ? ` / ${usage.live_runs_limit}` : ""}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-zinc-200/80 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className={labelClass}>Remaining Today</p>
                  <p className="mt-2 text-xl font-black text-zinc-950 dark:text-zinc-100">
                    {typeof usage?.live_runs_remaining === "number" ? usage.live_runs_remaining : "Unlimited"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={sectionCardClass}>
          <div className="mb-6">
            <p className={labelClass}>Entitlements</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
              Feature access mapped to subscription
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {usageFeatureRows.map((row) => (
              <div
                className="flex items-center justify-between rounded-[1.1rem] border border-zinc-200/80 bg-zinc-50/90 px-4 py-3 dark:border-white/10 dark:bg-[rgba(12,12,14,0.94)]"
                key={row.label}
              >
                <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{row.label}</span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em]",
                    row.enabled
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                      : "border border-zinc-200 bg-white text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
                  )}
                >
                  {row.enabled ? "Enabled" : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <SidebarCard
          accent="brand"
          copy="Move into paid plans only when you need unlimited LIVE collection, deeper synthesis, and advanced generators."
          eyebrow="Plan Controls"
          icon={CreditCard}
          title={formatPlan(profilePlan)}
        >
          <div className="space-y-3">
            {profilePlan === "free" ? (
              <Button
                className="h-11 w-full rounded-xl bg-zinc-950 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                onClick={() => handleUpgrade("pro")}
              >
                Upgrade to Pro
              </Button>
            ) : null}
            {profilePlan !== "free" && PORTAL_URL ? (
              <Button
                className="h-11 w-full rounded-xl bg-zinc-950 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                onClick={() => {
                  window.location.href = PORTAL_URL;
                }}
              >
                Manage Billing
              </Button>
            ) : null}
            <Link
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.16em] text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
              href="/"
            >
              Return to Engine
            </Link>
          </div>
        </SidebarCard>
      </aside>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950 transition-colors dark:bg-[#050505] dark:text-zinc-100 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.2rem] border border-zinc-200/80 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(9,9,12,0.92)] dark:shadow-[0_38px_100px_rgba(0,0,0,0.52)]"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.35 }}
        >
          <div className="relative h-52 overflow-hidden sm:h-56">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#38bdf8_0%,#6366f1_45%,#f59e0b_100%)] dark:bg-[linear-gradient(135deg,#4f46e5_0%,#8b5cf6_45%,#ec4899_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.42),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(255,255,255,0.18),transparent_32%)] opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent dark:from-black/35" />
            <div className="absolute right-4 top-4 rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
              Live Workspace State
            </div>
          </div>

          <div className="px-5 pb-8 md:px-8 lg:px-10">
            <div className="flex flex-col gap-6 border-b border-zinc-200/80 pb-8 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
              <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[2rem] border-[6px] border-white bg-zinc-950 text-3xl font-black tracking-tight text-white shadow-[0_20px_45px_rgba(15,23,42,0.12)] dark:border-[#09090c] dark:bg-[#121216]">
                  {getInitials(displayName)}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                      {formatPlan(profilePlan)}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                      {summary?.subscription?.status || "active"}
                    </span>
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-100">
                    {workspaceName}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Owned by {displayName}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {workEmail || "No work email"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      {workspaceName.replace(/\s+/g, "-").toLowerCase()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Joined {formatDate(joinedDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                  href="/"
                >
                  Return to Engine
                </Link>
                <Button
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-900 shadow-none hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
                  onClick={() => setActiveTab("Billing")}
                  variant="outline"
                >
                  Billing
                </Button>
                <Button
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-900 shadow-none hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
                  onClick={focusInviteSection}
                  variant="outline"
                >
                  Invite Team
                </Button>
                <Button
                  className="h-11 w-11 rounded-xl border border-zinc-200 bg-white px-0 text-zinc-900 shadow-none hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
                  onClick={() => void signOut()}
                  variant="outline"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                hint="Supabase-backed analyses"
                label="Analyses"
                value={summary?.savedAnalysesCount ?? analyses.length}
              />
              <StatCard
                hint="Public and private links"
                label="Shared Links"
                value={summary?.sharedReportsCount ?? sharedReportEntries.length}
              />
              <StatCard hint="Active seats" label="Members" value={activeMembers.length} />
              <StatCard hint="First workspace record" label="Joined" value={formatDate(joinedDate)} />
            </div>

            <div className="mt-8 flex flex-wrap gap-2 rounded-[1.3rem] border border-zinc-200/80 bg-zinc-50/80 p-2 dark:border-white/10 dark:bg-[rgba(12,12,14,0.92)]">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "relative flex h-11 items-center justify-center rounded-[1rem] px-4 text-[0.7rem] font-black uppercase tracking-[0.16em] transition-colors",
                    activeTab === tab
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-500 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                  )}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {tab}
                  {activeTab === tab ? (
                    <motion.span
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-current opacity-60"
                      layoutId="workspace-profile-tab"
                    />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {loading ? (
                <div className={sectionCardClass}>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your workspace...</p>
                </div>
              ) : null}

              {!loading && error ? (
                <div className={sectionCardClass}>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : null}

              {!loading && !error && workspaceMessage ? (
                <div className="mb-6 rounded-[1.2rem] border border-zinc-200/80 bg-zinc-50/90 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-[rgba(12,12,14,0.92)] dark:text-zinc-300">
                  {workspaceMessage}
                </div>
              ) : null}

              {!loading && !error && activeTab === "Workspace" ? renderWorkspaceTab() : null}
              {!loading && !error && activeTab === "Analyses" ? renderAnalysesTab() : null}
              {!loading && !error && activeTab === "Reports" ? renderReportsTab() : null}
              {!loading && !error && activeTab === "Billing" ? renderBillingTab() : null}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

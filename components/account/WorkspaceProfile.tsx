"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Building,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  FolderKanban,
  Globe,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  User,
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
      {children}
    </p>
  );
}

function ProfileSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function IconInput({
  id,
  label,
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={id ?? label.toLowerCase()}>{label}</FieldLabel>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          {...props}
          id={id}
          className={cn(
            "h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-10 text-sm font-medium text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20",
            className
          )}
        />
      </div>
    </div>
  );
}

function TextAreaField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  rows = 4,
  className
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
        <textarea
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          value={value}
        />
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  options,
  className
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <select
          className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-0 pl-10 pr-10 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}

function SidebarCard({
  title,
  icon: Icon,
  tone = "default",
  children
}: {
  title: string;
  icon: LucideIcon;
  tone?: "default" | "brand" | "success";
  children: ReactNode;
}) {
  const toneClass =
    tone === "brand"
      ? "bg-indigo-50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/20"
      : tone === "success"
        ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20"
        : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800";
  const iconClass =
    tone === "brand"
      ? "text-indigo-500"
      : tone === "success"
        ? "text-emerald-500"
        : "text-zinc-500 dark:text-zinc-300";

  return (
    <div className={cn("rounded-[24px] border p-6", toneClass)}>
      <div className="mb-4 flex items-center gap-3">
        <Icon className={cn("h-5 w-5", iconClass)} />
        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function TabButton({
  isActive,
  onClick,
  children
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "relative rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] transition-all",
        isActive
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

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
  const displayName = profileName || session?.user.full_name || "Workspace Owner";
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
  const ownerMember =
    members.find((member) => member.user_id === summary?.profile?.id && member.status === "active") ?? null;

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

  const billingCopy = useMemo(() => {
    if (profilePlan === "agency") {
      return "Agency unlocks multi-workspace delivery, team roles, and white-label report controls.";
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
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <SectionLabel>Account Access</SectionLabel>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign in to access your workspace.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Saved analyses, team access, billing state, and workspace settings live behind your
            account.
          </p>
          <Link
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-xs font-bold uppercase tracking-[0.18em] text-white dark:bg-zinc-100 dark:text-zinc-900"
            href="/auth"
          >
            Continue to Login
          </Link>
        </div>
      </main>
    );
  }

  const renderWorkspaceContent = () => (
    <div className="space-y-8">
      <ProfileSection title="Owner Information">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <IconInput
            icon={User}
            label="First Name"
            onChange={(event) =>
              setSettings((current) => ({ ...current, firstName: event.target.value }))
            }
            placeholder="First name"
            value={settings.firstName}
          />
          <IconInput
            icon={User}
            label="Last Name"
            onChange={(event) =>
              setSettings((current) => ({ ...current, lastName: event.target.value }))
            }
            placeholder="Last name"
            value={settings.lastName}
          />
          <IconInput
            className="sm:col-span-2"
            icon={Mail}
            label="Email Address"
            onChange={(event) =>
              setSettings((current) => ({ ...current, workEmail: event.target.value }))
            }
            placeholder="owner@workspace.com"
            type="email"
            value={settings.workEmail}
          />
        </div>
      </ProfileSection>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      <ProfileSection title="Workspace Information">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <IconInput
            className="sm:col-span-2"
            icon={Building}
            label="Workspace Name"
            onChange={(event) =>
              setSettings((current) => ({ ...current, workspaceName: event.target.value }))
            }
            placeholder="Workspace name"
            value={settings.workspaceName}
          />
          <IconInput
            icon={Sparkles}
            label="Primary Use Case"
            onChange={(event) =>
              setSettings((current) => ({ ...current, primaryUseCase: event.target.value }))
            }
            placeholder="Primary use case"
            value={settings.primaryUseCase}
          />
          <IconInput
            icon={Users}
            label="Team Size"
            onChange={(event) =>
              setSettings((current) => ({ ...current, teamSize: event.target.value }))
            }
            placeholder="Team size"
            value={settings.teamSize}
          />
          <IconInput
            className="sm:col-span-2"
            icon={MapPin}
            label="Industry"
            onChange={(event) =>
              setSettings((current) => ({ ...current, industry: event.target.value }))
            }
            placeholder="Industry"
            value={settings.industry}
          />
        </div>
      </ProfileSection>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      <ProfileSection title="Team Access">
        <div className="space-y-5">
          <TextAreaField
            className="sm:col-span-2"
            icon={Mail}
            id="invite-emails"
            label="Invite Emails"
            onChange={setInviteEmails}
            placeholder="Enter email addresses (comma-separated)"
            rows={4}
            value={inviteEmails}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            <SelectField
              icon={ShieldCheck}
              id="invite-role"
              label="Role"
              onChange={setInviteRole}
              options={[
                { label: "Member", value: "member" },
                { label: "Strategist", value: "strategist" },
                { label: "Admin", value: "admin" }
              ]}
              value={inviteRole}
            />
            <div className="space-y-2">
              <FieldLabel htmlFor="invite-submit">Invite Action</FieldLabel>
              <Button
                className="h-11 w-full rounded-xl bg-zinc-900 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                disabled={inviteSaving}
                id="invite-submit"
                onClick={() => void handleInviteSubmit()}
              >
                {inviteSaving ? "Saving..." : "Send Invite"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {invites.length ? (
              invites.map((invite) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                  key={invite.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {invite.invited_email || "Pending invite"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{invite.status}</p>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                    {getRoleLabel(invite.role)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                No pending team invites yet.
              </div>
            )}
          </div>
        </div>
      </ProfileSection>

      <div className="flex justify-end pt-2">
        <Button
          className="h-12 rounded-xl bg-indigo-500 px-8 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-600"
          disabled={savePending}
          onClick={() => void handleSaveSettings()}
        >
          {savePending ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );

  const renderAnalysesContent = () => (
    <div className="space-y-8">
      <ProfileSection title="Recent Analyses">
        {analyses.length ? (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
                key={analysis.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      {analysis.query}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    onClick={() => handleRestoreAnalysis(analysis.id)}
                  >
                    Restore Analysis
                  </Button>
                  {analysis.is_public ? (
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
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
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            No saved analyses yet.
          </div>
        )}
      </ProfileSection>
    </div>
  );

  const renderReportsContent = () => (
    <div className="space-y-8">
      <ProfileSection title="Shared Reports">
        {sharedReportEntries.length ? (
          <div className="space-y-4">
            {sharedReportEntries.map(({ analysis, report, shareUrl }) => (
              <div
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
                key={analysis.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      {analysis.query}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      {report?.is_public ? "Public" : "Private"} • {formatDateTime(report?.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                    {report?.is_public ? "Public" : "Private"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    disabled={!report?.is_public}
                    onClick={() => void handleCopyLink(analysis.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                  <Link
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold uppercase tracking-[0.18em] dark:border-zinc-800 dark:bg-zinc-950",
                      report?.is_public
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "pointer-events-none text-zinc-400 dark:text-zinc-500"
                    )}
                    href={report?.is_public ? `/analysis/${analysis.id}` : "#"}
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
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
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            No shared reports yet.
          </div>
        )}
      </ProfileSection>
    </div>
  );

  const renderBillingContent = () => (
    <div className="space-y-8">
      <ProfileSection title="Plan and Billing">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <SectionLabel>Current Plan</SectionLabel>
            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatPlan(profilePlan)}
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{billingCopy}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <SectionLabel>Usage Summary</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">
                  Live Analyses Today
                </p>
                <p className="mt-2 text-xl font-black text-zinc-900 dark:text-zinc-100">
                  {usage?.live_runs_today ?? 0}
                  {typeof usage?.live_runs_limit === "number" ? ` / ${usage.live_runs_limit}` : ""}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">
                  Remaining Today
                </p>
                <p className="mt-2 text-xl font-black text-zinc-900 dark:text-zinc-100">
                  {typeof usage?.live_runs_remaining === "number" ? usage.live_runs_remaining : "Unlimited"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProfileSection>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      <ProfileSection title="Entitlements">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {usageFeatureRows.map((row) => (
            <div
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
              key={row.label}
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.label}</span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em]",
                  row.enabled
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                )}
              >
                {row.enabled ? "Enabled" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </ProfileSection>
    </div>
  );

  const renderMainColumn = () => {
    if (activeTab === "Analyses") {
      return renderAnalysesContent();
    }

    if (activeTab === "Reports") {
      return renderReportsContent();
    }

    if (activeTab === "Billing") {
      return renderBillingContent();
    }

    return renderWorkspaceContent();
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-[#050505] dark:text-zinc-100">
      <div className="mx-auto w-full max-w-5xl">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative h-48 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_36%)]" />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className="rounded-xl bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                {formatPlan(profilePlan)}
              </span>
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/30"
                href="/"
              >
                <Camera className="h-4 w-4" />
                Return to Engine
              </Link>
            </div>
          </div>

          <div className="px-6 pb-8 md:px-8">
            <div className="relative z-10 mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="-mt-16 flex h-32 w-32 shrink-0 items-center justify-center rounded-[32px] border-4 border-white bg-zinc-100 shadow-lg dark:border-zinc-950 dark:bg-zinc-900">
                <span className="text-4xl font-black tracking-tight text-zinc-300 dark:text-zinc-700">
                  {getInitials(displayName)}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {summary?.subscription?.status || "active"}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {getRoleLabel(ownerMember?.role || "owner")}
                  </span>
                </div>
                <h1 className="truncate text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
                  {workspaceName}
                </h1>
                <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {displayName} · Workspace Owner
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-500 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {workEmail || "No email on file"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {activeMembers.length} active members
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Joined {formatDate(joinedDate)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                <Button
                  className="h-10 rounded-xl bg-zinc-900 px-5 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  onClick={() => setActiveTab("Billing")}
                >
                  Manage Billing
                </Button>
                <Button
                  className="h-10 rounded-xl border-zinc-200 bg-white px-5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-900 shadow-none hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={focusInviteSection}
                  variant="outline"
                >
                  Invite Team
                </Button>
                <Button
                  aria-label="Sign out"
                  className="h-10 w-10 rounded-xl border-zinc-200 bg-white px-0 text-zinc-900 shadow-none hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => void signOut()}
                  variant="outline"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-8 flex flex-wrap gap-2 rounded-[20px] border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
              {tabs.map((tab) => (
                <TabButton isActive={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>
                  {tab}
                </TabButton>
              ))}
            </div>

            {workspaceMessage ? (
              <div
                aria-live="polite"
                className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
              >
                {workspaceMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                Loading your workspace...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {!loading && !error ? (
              <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
                <div className="space-y-8 md:col-span-8">{renderMainColumn()}</div>

                <aside className="space-y-6 md:col-span-4">
                  <SidebarCard icon={CheckCircle2} title="Workspace Completeness" tone="success">
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                      {completionPercent}% complete. Finish the owner and workspace context fields to
                      lock in a clean account surface.
                    </p>
                  </SidebarCard>

                  <SidebarCard icon={AlertCircle} title="Email / Account Status" tone="brand">
                    <p className="text-xs font-medium leading-6 text-zinc-600 dark:text-zinc-300">
                      Signed in as <span className="font-bold">{workEmail || "workspace owner"}</span>.
                      This workspace is backed by live Supabase auth and persisted account records.
                    </p>
                    <Button
                      className="mt-4 h-10 w-full rounded-xl border-indigo-200 bg-white text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 shadow-none hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-zinc-950 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                      onClick={() => {
                        window.location.href = "/auth";
                      }}
                      variant="outline"
                    >
                      Review Access
                    </Button>
                  </SidebarCard>

                  <SidebarCard icon={CreditCard} title="Plan / Billing Summary">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">
                          Current Plan
                        </p>
                        <p className="mt-2 text-xl font-black text-zinc-900 dark:text-zinc-100">
                          {formatPlan(profilePlan)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500">
                          Remaining Live Runs
                        </p>
                        <p className="mt-2 text-xl font-black text-zinc-900 dark:text-zinc-100">
                          {typeof usage?.live_runs_remaining === "number" ? usage.live_runs_remaining : "Unlimited"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                      {billingCopy}
                    </p>
                    {profilePlan === "free" ? (
                      <Button
                        className="mt-4 h-10 w-full rounded-xl bg-zinc-900 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        onClick={() => handleUpgrade("pro")}
                      >
                        Upgrade to Pro
                      </Button>
                    ) : PORTAL_URL ? (
                      <Button
                        className="mt-4 h-10 w-full rounded-xl bg-zinc-900 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        onClick={() => {
                          window.location.href = PORTAL_URL;
                        }}
                      >
                        Open Billing Portal
                      </Button>
                    ) : null}
                  </SidebarCard>

                  <SidebarCard icon={FolderKanban} title="Quick Stats">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
                          Analyses
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-100">
                          {summary?.savedAnalysesCount ?? analyses.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
                          Reports
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-100">
                          {summary?.sharedReportsCount ?? sharedReportEntries.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
                          Members
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-100">
                          {activeMembers.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
                          Shared
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-100">
                          {sharedReportEntries.filter((entry) => entry.report?.is_public).length}
                        </p>
                      </div>
                    </div>
                  </SidebarCard>
                </aside>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </main>
  );
}

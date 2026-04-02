"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Copy,
  CreditCard,
  ExternalLink,
  FolderKanban,
  Link2,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  persistPendingAnalysisRestore,
  persistPendingPlan,
  persistStoredPlan
} from "@/lib/client-identity";
import type {
  AccountSummaryResponse,
  PersistedAnalysisRecord,
  UserPlan,
  WorkspaceMemberRecord
} from "@/types/market-analysis";

const tabs = ["Analyses", "Reports", "Workspace", "Billing"] as const;
type WorkspaceProfileTab = (typeof tabs)[number];

const CHECKOUT_URL = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";
const PORTAL_URL = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL || "";

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

export default function WorkspaceProfile({
  initialTab = "Analyses"
}: {
  initialTab?: WorkspaceProfileTab;
}) {
  const { isAuthenticated, isReady, plan, session, setPlan, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceProfileTab>(initialTab);
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-zinc-900/80 p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
            Account Access
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Sign in to access your workspace.</h1>
          <p className="mt-4 text-zinc-400">
            Your saved analyses, live plan state, shared reports, and workspace settings live
            behind your account.
          </p>
          <Link
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-950"
            href="/auth"
          >
            Continue to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-6xl rounded-[2.5rem] bg-zinc-50/5 p-4 md:p-10">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="relative h-52 overflow-hidden bg-zinc-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.22),transparent_38%),linear-gradient(135deg,#09090b,#111827,#09090b)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          </div>

          <div className="relative border-b border-white/10 bg-zinc-950 px-6 pb-6">
            <div className="mb-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="relative -mt-16 flex items-end gap-5">
                <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-4 border-zinc-950 bg-zinc-100 text-3xl font-black text-zinc-900">
                  {getInitials(displayName)}
                </div>
                <div className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-100">
                      {formatPlan(profilePlan)}
                    </span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      {summary?.subscription?.status || "active"}
                    </span>
                  </div>
                  <h1 className="mt-4 text-2xl font-black tracking-tight text-zinc-100">{displayName}</h1>
                  <p className="mt-1 text-sm font-medium text-zinc-400">{workspaceName}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-0">
                <button
                  className="h-10 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Workspace")}
                  type="button"
                >
                  Edit Profile
                </button>
                <button
                  className="h-10 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Workspace")}
                  type="button"
                >
                  Manage Workspace
                </button>
                <button
                  className="h-10 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Billing")}
                  type="button"
                >
                  Billing
                </button>
                <button
                  className="h-10 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={focusInviteSection}
                  type="button"
                >
                  Invite Team
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-zinc-100"
                  onClick={() => void signOut()}
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Analyses
                </p>
                <p className="mt-3 text-2xl font-black text-zinc-100">
                  {summary?.savedAnalysesCount ?? analyses.length}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Shared Links
                </p>
                <p className="mt-3 text-2xl font-black text-zinc-100">
                  {summary?.sharedReportsCount ?? sharedReportEntries.length}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Members
                </p>
                <p className="mt-3 text-2xl font-black text-zinc-100">{activeMembers.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Joined
                </p>
                <p className="mt-3 text-sm font-bold text-zinc-100">{formatDate(joinedDate)}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {workEmail || "No work email"}
              </span>
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                {workspaceName.replace(/\s+/g, "-").toLowerCase()}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatDate(joinedDate)}
              </span>
            </div>
          </div>

          <div className="flex border-b border-white/10 bg-zinc-950">
            {tabs.map((tab) => (
              <button
                className="relative flex h-12 flex-1 items-center justify-center text-[13px] font-bold text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-zinc-100"
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                <span className={activeTab === tab ? "text-zinc-100" : ""}>{tab}</span>
                {activeTab === tab ? (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 mx-auto h-1 w-12 rounded-t-full bg-zinc-100"
                    layoutId="workspaceProfileTabIndicator"
                  />
                ) : null}
              </button>
            ))}
          </div>

          <div className="min-h-[460px] bg-zinc-950">
            {loading ? <div className="p-6 text-sm text-zinc-400">Loading your workspace...</div> : null}
            {!loading && error ? <div className="p-6 text-sm text-red-400">{error}</div> : null}
            {!loading && !error && workspaceMessage ? (
              <div className="border-b border-white/10 px-6 py-4 text-sm text-zinc-300">{workspaceMessage}</div>
            ) : null}

            {!loading && !error && activeTab === "Analyses" ? (
              analyses.length ? (
                <div className="divide-y divide-white/10">
                  {analyses.map((analysis) => (
                    <div className="flex gap-4 bg-zinc-950 p-5 transition-colors hover:bg-zinc-900/30" key={analysis.id}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-100">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-zinc-100">{analysis.query}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {analysis.market_type || "No market context"} • {analysis.depth} •{" "}
                              {analysis.result_json.source_meta.mode}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-zinc-500">
                            {formatDateTime(analysis.created_at)}
                          </span>
                        </div>
                        <p className="text-[14px] leading-snug text-zinc-300">
                          {analysis.result_json.dominant_narrative}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-100"
                            onClick={() => handleRestoreAnalysis(analysis.id)}
                            type="button"
                          >
                            Restore in Engine
                          </button>
                          {analysis.is_public ? (
                            <Link
                              className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-100"
                              href={`/analysis/${analysis.id}`}
                            >
                              Open Shared View
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-sm text-zinc-400">No saved analyses yet.</div>
              )
            ) : null}

            {!loading && !error && activeTab === "Reports" ? (
              <div className="space-y-4 p-6">
                <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Shared Reports
                  </p>
                  <p className="mt-3 text-3xl font-black text-zinc-100">
                    {summary?.sharedReportsCount ?? sharedReportEntries.length}
                  </p>
                  <p className="mt-3 text-sm text-zinc-400">
                    Reports reflect real persisted analyses and their current share state.
                  </p>
                </div>

                {sharedReportEntries.length ? (
                  sharedReportEntries.map(({ analysis, report, shareUrl }) => (
                    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4" key={analysis.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-zinc-100">{analysis.query}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {report?.is_public ? "Public" : "Private"} • {formatDateTime(report?.created_at)}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-100">
                          {report?.is_public ? "Public" : "Private"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-100 disabled:opacity-40"
                          disabled={!report?.is_public}
                          onClick={() => void handleCopyLink(analysis.id)}
                          type="button"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link
                        </button>
                        <Link
                          className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
                            report?.is_public ? "text-zinc-100" : "pointer-events-none text-zinc-500"
                          }`}
                          href={report?.is_public ? `/analysis/${analysis.id}` : "#"}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Link
                        </Link>
                        {report?.is_public ? (
                          <p className="truncate text-xs text-zinc-500">{shareUrl}</p>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">
                    No shared reports yet. Public analyses will appear here automatically.
                  </p>
                )}
              </div>
            ) : null}

            {!loading && !error && activeTab === "Workspace" ? (
              <div className="space-y-4 p-6">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Workspace Details
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Name
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-100">
                          {summary?.workspace?.name || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Primary Use Case
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-100">
                          {summary?.workspace?.primary_use_case || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Team Size
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-100">
                          {summary?.workspace?.team_size || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Industry
                        </p>
                        <p className="mt-2 text-lg font-black text-zinc-100">
                          {summary?.workspace?.industry || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Profile
                    </p>
                    <p className="mt-4 text-lg font-black text-zinc-100">{displayName}</p>
                    <p className="mt-2 text-sm text-zinc-400">{workEmail || "No work email"}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                      <ShieldCheck className="h-4 w-4 text-zinc-100" />
                      Account backed by live Supabase identity and workspace data.
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                        Team Members
                      </p>
                      <span className="text-xs font-bold text-zinc-500">{activeMembers.length} active</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {activeMembers.length ? (
                        activeMembers.map((member) => {
                          const label =
                            member.user_id === summary?.profile?.id ? displayName : member.invited_email || "Workspace member";

                          return (
                            <div
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3"
                              key={member.id}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-100">
                                  <Users className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-zinc-100">{label}</p>
                                  <p className="text-xs text-zinc-500">{member.status}</p>
                                </div>
                              </div>
                              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-100">
                                {getRoleLabel(member.role)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-zinc-400">No active workspace members yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Invite Team
                    </p>
                    <textarea
                      className="mt-4 min-h-[132px] w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm font-semibold text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/30"
                      onChange={(event) => setInviteEmails(event.target.value)}
                      placeholder="name@company.com, strategist@company.com"
                      ref={inviteInputRef}
                      value={inviteEmails}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <select
                        className="h-11 rounded-2xl border border-white/10 bg-zinc-950/80 px-4 text-sm font-semibold text-zinc-100"
                        onChange={(event) => setInviteRole(event.target.value)}
                        value={inviteRole}
                      >
                        <option value="member">Member</option>
                        <option value="strategist">Strategist</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 disabled:opacity-50"
                        disabled={inviteSaving}
                        onClick={() => void handleInviteSubmit()}
                        type="button"
                      >
                        {inviteSaving ? "Saving..." : "Send Invite"}
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {invites.length ? (
                        invites.map((invite) => (
                          <div
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3"
                            key={invite.id}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-100">
                                <Mail className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-100">
                                  {invite.invited_email || "Pending invite"}
                                </p>
                                <p className="text-xs text-zinc-500">{invite.status}</p>
                              </div>
                            </div>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-100">
                              {getRoleLabel(invite.role)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-400">
                          No pending team invites. This workspace is still personal.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!loading && !error && activeTab === "Billing" ? (
              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                          Current Plan
                        </p>
                        <p className="mt-3 text-3xl font-black text-zinc-100">
                          {formatPlan(profilePlan)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-100">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-400">{billingCopy}</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Usage Summary
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          LIVE Analyses Today
                        </p>
                        <p className="mt-2 text-xl font-black text-zinc-100">
                          {usage?.live_runs_today ?? 0}
                          {typeof usage?.live_runs_limit === "number" ? ` / ${usage.live_runs_limit}` : ""}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          Remaining Today
                        </p>
                        <p className="mt-2 text-xl font-black text-zinc-100">
                          {typeof usage?.live_runs_remaining === "number" ? usage.live_runs_remaining : "Unlimited"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Entitlements
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {usageFeatureRows.map((row) => (
                      <div
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3"
                        key={row.label}
                      >
                        <span className="text-sm font-semibold text-zinc-100">{row.label}</span>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                            row.enabled
                              ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                              : "border border-white/10 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {row.enabled ? "Enabled" : "Locked"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950"
                    href="/"
                  >
                    Return to Engine
                  </Link>
                  {profilePlan === "free" ? (
                    <button
                      className="rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-100"
                      onClick={() => handleUpgrade("pro")}
                      type="button"
                    >
                      Upgrade to Pro
                    </button>
                  ) : null}
                  {profilePlan !== "free" && PORTAL_URL ? (
                    <button
                      className="rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-100"
                      onClick={() => {
                        window.location.href = PORTAL_URL;
                      }}
                      type="button"
                    >
                      Manage Billing
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

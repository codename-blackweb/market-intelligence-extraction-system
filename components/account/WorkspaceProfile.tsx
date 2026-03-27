"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  FolderKanban,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  Sparkles,
  Users
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { persistStoredPlan } from "@/lib/client-identity";
import type {
  AccountSummaryResponse,
  PersistedAnalysisRecord,
  UserPlan
} from "@/types/market-analysis";

const tabs = ["Analyses", "Reports", "Workspace", "Billing"] as const;

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function WorkspaceProfile() {
  const { isAuthenticated, isReady, plan, session, setPlan, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Analyses");
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/account?userId=${encodeURIComponent(session.user.id)}`, {
          cache: "no-store"
        });
        const json = (await response.json()) as AccountSummaryResponse;

        if (!response.ok || !json.success) {
          throw new Error(json.error || "Unable to load workspace.");
        }

        if (isMounted) {
          setSummary(json);
          if (json.profile?.plan === "pro" || json.profile?.plan === "agency") {
            setPlan(json.profile.plan);
            persistStoredPlan(json.profile.plan);
          }
        }
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
  }, [isReady, session?.user.id, setPlan]);

  const analyses = summary?.analyses ?? [];
  const publicReports = analyses.filter((item) => item.is_public);
  const profilePlan = summary?.profile?.plan ?? plan;
  const displayName = session?.user.full_name || "Workspace User";
  const workspaceName = summary?.workspace?.name || "Personal Workspace";
  const joinedDate = summary?.profile?.created_at ?? session?.user.created_at;

  const billingCopy = useMemo(() => {
    if (profilePlan === "agency") {
      return "White-label exports, team workflows, and client-ready reporting are active.";
    }

    if (profilePlan === "pro") {
      return "Unlimited LIVE analyses and deeper synthesis are active for this workspace.";
    }

    return "Upgrade when you need deeper synthesis, workspace controls, and premium exports.";
  }, [profilePlan]);

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
            Your saved analyses, plan state, shared reports, and workspace settings live behind
            your account.
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
      <div className="mx-auto w-full max-w-5xl rounded-[2.5rem] bg-zinc-50/5 p-4 md:p-10">
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="sticky top-0 z-10 flex h-14 items-center border-b border-white/10 bg-zinc-950/90 px-4 backdrop-blur-xl">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold leading-tight text-zinc-100">{displayName}</h2>
              <span className="text-[11px] font-medium text-zinc-500">
                {summary?.savedAnalysesCount ?? analyses.length} saved analyses
              </span>
            </div>
          </div>

          <div className="relative h-48 overflow-hidden bg-zinc-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.3),transparent_42%),linear-gradient(135deg,#0f172a,#111827,#0b1120)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <div className="relative border-b border-white/10 bg-zinc-950 px-6 pb-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="relative -mt-16">
                <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border-4 border-zinc-950 bg-zinc-100 text-3xl font-black text-zinc-900">
                  {getInitials(displayName)}
                </div>
                <div className="absolute bottom-1 right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border-4 border-zinc-950 bg-white text-zinc-900 shadow-sm">
                  <Sparkles className="h-4 w-4 fill-current" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="h-9 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Workspace")}
                  type="button"
                >
                  Edit Profile
                </button>
                <button
                  className="h-9 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Workspace")}
                  type="button"
                >
                  Manage Workspace
                </button>
                <button
                  className="h-9 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Billing")}
                  type="button"
                >
                  Billing
                </button>
                <button
                  className="h-9 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-100"
                  onClick={() => setActiveTab("Workspace")}
                  type="button"
                >
                  Invite Team
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-zinc-100"
                  onClick={() => void signOut()}
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-100">{displayName}</h1>
              <p className="mb-3 text-sm font-medium text-zinc-500">{workspaceName}</p>
              <p className="mb-3 text-[14px] leading-snug text-zinc-100">
                {summary?.workspace
                  ? `Built for ${summary.workspace.use_case.toLowerCase()} teams working inside ${summary.workspace.industry.toLowerCase()} markets and turning live demand into strategic output.`
                  : "Turning live demand signals into usable strategic direction."}
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {summary?.workspace?.industry || "Multi-market"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-zinc-100" />
                  <span className="font-bold text-zinc-100">{workspaceName.replace(/\s+/g, "-").toLowerCase()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatDate(joinedDate)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-100">{summary?.savedAnalysesCount ?? analyses.length}</span>
                  <span className="font-medium text-zinc-500">Analyses</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-100">{summary?.sharedReportsCount ?? publicReports.length}</span>
                  <span className="font-medium text-zinc-500">Shared Reports</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-100">{formatPlan(profilePlan)}</span>
                  <span className="font-medium text-zinc-500">Plan</span>
                </div>
              </div>
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

          <div className="min-h-[420px] bg-zinc-950">
            {loading ? (
              <div className="p-6 text-sm text-zinc-400">Loading your workspace...</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-400">{error}</div>
            ) : null}

            {!loading && !error && activeTab === "Analyses" ? (
              analyses.length ? (
                analyses.map((analysis) => (
                  <div
                    className="flex gap-4 border-b border-white/10 bg-zinc-950 p-5 transition-colors hover:bg-zinc-900/30"
                    key={analysis.id}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-100">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <div className="truncate text-sm">
                          <span className="font-bold text-zinc-100">{analysis.query}</span>
                          <span className="mx-2 text-zinc-500">·</span>
                          <span className="font-medium text-zinc-500">{analysis.depth}</span>
                        </div>
                        <span className="text-xs font-medium text-zinc-500">
                          {formatDate(analysis.created_at)}
                        </span>
                      </div>
                      <p className="text-[14px] leading-snug text-zinc-300">
                        {analysis.result_json.dominant_narrative}
                      </p>
                    </div>
                  </div>
                ))
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
                  <p className="mt-3 text-3xl font-black text-zinc-100">{publicReports.length}</p>
                </div>
                <div className="space-y-3">
                  {publicReports.length ? (
                    publicReports.map((report) => (
                      <div
                        className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4"
                        key={report.id}
                      >
                        <p className="font-bold text-zinc-100">{report.query}</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          <Link className="underline" href={`/analysis/${report.id}`}>
                            /analysis/{report.id}
                          </Link>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-400">
                      No shared reports yet. Public analyses will appear here automatically.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {!loading && !error && activeTab === "Workspace" ? (
              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Primary Use Case
                    </p>
                    <p className="mt-3 text-lg font-black text-zinc-100">
                      {summary?.workspace?.use_case || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                      Team Size
                    </p>
                    <p className="mt-3 text-lg font-black text-zinc-100">
                      {summary?.workspace?.team_size || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Team Invites
                  </p>
                  <div className="mt-4 space-y-3">
                    {summary?.invites?.length ? (
                      summary.invites.map((invite) => (
                        <div
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3"
                          key={invite.id}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-100">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-100">{invite.email}</p>
                              <p className="text-xs text-zinc-500">
                                {invite.role} • {invite.status}
                              </p>
                            </div>
                          </div>
                          <Users className="h-4 w-4 text-zinc-500" />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-400">
                        No pending team invites. This workspace is currently personal.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {!loading && !error && activeTab === "Billing" ? (
              <div className="space-y-4 p-6">
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
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950"
                    href="/"
                  >
                    Return to Engine
                  </Link>
                  {profilePlan === "free" ? (
                    <Link
                      className="rounded-full border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-100"
                      href="/?upgrade=pro"
                    >
                      Upgrade to Pro
                    </Link>
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

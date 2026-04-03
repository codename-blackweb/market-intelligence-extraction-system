"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AnalysisCard from "@/components/workspace/AnalysisCard";
import FilterSidebar from "@/components/workspace/FilterSidebar";
import PinnedCard from "@/components/workspace/PinnedCard";
import RunAnalysisPanel from "@/components/workspace/RunAnalysisPanel";
import WorkspaceTopBar from "@/components/workspace/WorkspaceTopBar";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  persistPendingAnalysisDraft,
  persistPendingAnalysisRestore,
  persistStoredPlan
} from "@/lib/client-identity";
import type { WorkspaceFilters } from "@/lib/types";
import {
  buildAnalysisDisplayRecord,
  emptyPendingAnalysisDraft,
  selectPinnedAnalyses
} from "@/lib/workspace-ui";
import type { AccountSummaryResponse, UserPlan } from "@/types/market-analysis";
import styles from "./workspace-ui.module.css";

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

const emptyFilters: WorkspaceFilters = {
  search: "",
  depths: [],
  modes: [],
  visibility: [],
  intentStages: []
};

export default function WorkspaceDashboard() {
  const { isAuthenticated, isReady, plan, session, setPlan, signOut } = useAuth();
  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<WorkspaceFilters>(emptyFilters);
  const [draft, setDraft] = useState(emptyPendingAnalysisDraft);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        setLoading(true);
        const nextSummary = await fetchAccountSummary(session.access_token);

        if (!mounted) {
          return;
        }

        const nextPlan =
          nextSummary.usage?.plan ??
          (nextSummary.subscription?.plan === "pro" || nextSummary.subscription?.plan === "agency"
            ? nextSummary.subscription.plan
            : "free");

        setSummary(nextSummary);
        setPlan(nextPlan);
        persistStoredPlan(nextPlan);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load workspace.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isReady, session?.access_token, setPlan]);

  const analyses = useMemo(
    () =>
      (summary?.analyses ?? [])
        .map(buildAnalysisDisplayRecord)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        ),
    [summary?.analyses]
  );

  const pinnedAnalyses = useMemo(() => selectPinnedAnalyses(analyses), [analyses]);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((record) => {
      const searchTarget = [
        record.query,
        record.marketType,
        record.dominantNarrative,
        record.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      if (filters.search && !searchTarget.includes(filters.search.toLowerCase())) {
        return false;
      }

      if (filters.depths.length && !filters.depths.includes(record.depth)) {
        return false;
      }

      if (filters.modes.length && !filters.modes.includes(record.mode)) {
        return false;
      }

      if (
        filters.visibility.length &&
        !filters.visibility.includes(record.isPublic ? "public" : "private")
      ) {
        return false;
      }

      if (filters.intentStages.length && !filters.intentStages.includes(record.intentStage)) {
        return false;
      }

      return true;
    });
  }, [analyses, filters]);

  const filterOptions = useMemo(
    () => ({
      depths: Array.from(
        new Set(analyses.map((record) => record.depth).filter((value): value is string => Boolean(value)))
      ),
      modes: Array.from(
        new Set(analyses.map((record) => record.mode).filter((value): value is string => Boolean(value)))
      ),
      intentStages: Array.from(
        new Set(
          analyses
            .map((record) => record.intentStage)
            .filter((value): value is string => Boolean(value))
        )
      )
    }),
    [analyses]
  );

  const currentPlan =
    summary?.usage?.plan ??
    (summary?.subscription?.plan === "pro" || summary?.subscription?.plan === "agency"
      ? summary.subscription.plan
      : plan);
  const workspaceName = summary?.workspace?.name || "IntentEngine";
  const displayName = summary?.profile
    ? `${summary.profile.first_name} ${summary.profile.last_name}`.trim()
    : session?.user.full_name || "Workspace owner";
  const email = summary?.profile?.work_email || session?.user.email || "No account email";

  const handleFilterToggle = (
    field: keyof Pick<WorkspaceFilters, "depths" | "modes" | "visibility" | "intentStages">,
    value: string
  ) => {
    setFilters((current) => {
      if (field === "visibility") {
        const visibilityValue = value as WorkspaceFilters["visibility"][number];
        const nextValues = current.visibility.includes(visibilityValue)
          ? current.visibility.filter((item) => item !== visibilityValue)
          : [...current.visibility, visibilityValue];

        return {
          ...current,
          visibility: nextValues
        };
      }

      const currentValues = current[field] as string[];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [field]: nextValues
      };
    });
  };

  const handleLaunch = () => {
    if (!draft.query.trim()) {
      setMessage("Enter a seed query before opening the runner.");
      return;
    }

    persistPendingAnalysisDraft({
      ...draft,
      query: draft.query.trim()
    });
    window.location.href = "/#run-analysis";
  };

  const handleOpenBlank = () => {
    persistPendingAnalysisDraft(emptyPendingAnalysisDraft);
    window.location.href = "/#run-analysis";
  };

  const handleResume = (analysisId: string) => {
    persistPendingAnalysisRestore(analysisId);
    window.location.href = "/#recent-analyses";
  };

  const handleSignOut = () => {
    void signOut().finally(() => {
      window.location.href = "/";
    });
  };

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return (
      <main className={styles.page}>
        <div className={styles.signinShell}>
          <section className={styles.signinCard}>
            <p className={styles.eyebrow}>Workspace Access</p>
            <h1 className={styles.signinTitle}>Sign in to open the new workspace surface.</h1>
            <p className={styles.signinCopy}>
              The workspace UI sits on top of the current account, analysis, and plan endpoints.
              Sign in to load saved analyses, usage, and account-level actions.
            </p>
            <Link className={styles.signinAction} href="/auth">
              Continue to login
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <WorkspaceTopBar
          displayName={displayName}
          email={email}
          onSignOut={handleSignOut}
          plan={currentPlan as UserPlan}
          usage={summary?.usage}
          workspaceName={workspaceName}
        />

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <FilterSidebar
              filters={filters}
              onClear={() => setFilters(emptyFilters)}
              onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
              onToggle={handleFilterToggle}
              options={filterOptions}
              resultCount={filteredAnalyses.length}
            />
          </aside>

          <div className={styles.content}>
            <RunAnalysisPanel
              draft={draft}
              message={message}
              onChange={(field, value) => {
                setDraft((current) => ({ ...current, [field]: value }));
                if (message) {
                  setMessage("");
                }
              }}
              onLaunch={handleLaunch}
              onOpenBlank={handleOpenBlank}
              plan={currentPlan as UserPlan}
              usage={summary?.usage}
            />

            <section className={styles.section}>
              <div className={styles.sectionSurface}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Pinned</p>
                    <h2 className={styles.sectionTitle}>High-signal analyses pulled forward.</h2>
                    <p className={styles.sectionCopy}>
                      Shared analyses are treated as pinned first. When none are shared, the highest
                      confidence recent runs are promoted instead.
                    </p>
                  </div>
                </div>

                {pinnedAnalyses.length ? (
                  <div className={styles.pinnedGrid}>
                    {pinnedAnalyses.map((record) => (
                      <PinnedCard key={record.id} record={record} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <h3 className={styles.emptyStateTitle}>No pinned analyses yet.</h3>
                    <p className={styles.emptyStateText}>
                      Run a new analysis or make one public to surface it here.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionSurface}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Recent Analyses</p>
                    <h2 className={styles.sectionTitle}>Information-dense cards for saved runs.</h2>
                    <p className={styles.sectionCopy}>
                      Resume a run in the existing engine or jump straight into the new analysis
                      detail view.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loadingState}>Loading your workspace analyses...</div>
                ) : null}

                {!loading && error ? <div className={styles.statusBanner}>{error}</div> : null}

                {!loading && !error && filteredAnalyses.length ? (
                  <div className={styles.analysisGrid}>
                    {filteredAnalyses.map((record) => (
                      <AnalysisCard key={record.id} onResume={handleResume} record={record} />
                    ))}
                  </div>
                ) : null}

                {!loading && !error && !filteredAnalyses.length ? (
                  <div className={styles.emptyState}>
                    <h3 className={styles.emptyStateTitle}>No analyses match the current filter set.</h3>
                    <p className={styles.emptyStateText}>
                      Clear the sidebar filters or open the runner to create a new analysis.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

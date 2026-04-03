"use client";

import { ArrowUpRight, Radar, Sparkles } from "lucide-react";
import { formatPlanLabel } from "@/lib/workspace-ui";
import type { PendingAnalysisDraft } from "@/lib/types";
import type { PlanUsageSummary, UserPlan } from "@/types/market-analysis";
import styles from "./workspace-ui.module.css";

export default function RunAnalysisPanel({
  draft,
  plan,
  usage,
  message,
  onChange,
  onLaunch,
  onOpenBlank
}: {
  draft: PendingAnalysisDraft;
  plan: UserPlan;
  usage?: PlanUsageSummary | null;
  message: string;
  onChange: (field: keyof PendingAnalysisDraft, value: string) => void;
  onLaunch: () => void;
  onOpenBlank: () => void;
}) {
  return (
    <section className={styles.runPanel}>
      <div className={styles.runHero}>
        <div>
          <p className={styles.eyebrow}>Run Analysis</p>
          <h2 className={styles.runTitle}>Stage a new market read without touching the backend.</h2>
          <p className={styles.panelHint}>
            This panel preloads the existing intelligence runner. Query, context, depth, and
            competitor inputs are handed off to the current engine flow.
          </p>
        </div>

        <span className={styles.planBadge}>
          <Sparkles size={14} />
          {formatPlanLabel(plan)} Plan
        </span>
      </div>

      <div className={styles.runGrid}>
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label className={styles.fieldLabel} htmlFor="workspace-query">
            Seed query
          </label>
          <input
            className={styles.surfaceInput}
            id="workspace-query"
            onChange={(event) => onChange("query", event.target.value)}
            placeholder="why are buyers hesitating to switch project tools"
            value={draft.query}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldMedium}`}>
          <label className={styles.fieldLabel} htmlFor="workspace-market-type">
            Market context
          </label>
          <input
            className={styles.surfaceInput}
            id="workspace-market-type"
            onChange={(event) => onChange("marketType", event.target.value)}
            placeholder="B2B SaaS"
            value={draft.marketType}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldSmall}`}>
          <label className={styles.fieldLabel} htmlFor="workspace-depth">
            Depth
          </label>
          <select
            className={styles.surfaceSelect}
            id="workspace-depth"
            onChange={(event) => onChange("depth", event.target.value)}
            value={draft.depth}
          >
            <option value="standard">Standard</option>
            <option value="deep">Deep</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldMedium}`}>
          <label className={styles.fieldLabel} htmlFor="workspace-competitors">
            Competitor names
          </label>
          <textarea
            className={styles.surfaceTextarea}
            id="workspace-competitors"
            onChange={(event) => onChange("competitorNames", event.target.value)}
            placeholder="asana, clickup, linear"
            rows={3}
            value={draft.competitorNames}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldMedium}`}>
          <label className={styles.fieldLabel} htmlFor="workspace-urls">
            Competitor URLs
          </label>
          <textarea
            className={styles.surfaceTextarea}
            id="workspace-urls"
            onChange={(event) => onChange("competitorUrls", event.target.value)}
            placeholder="asana.com&#10;linear.app"
            rows={3}
            value={draft.competitorUrls}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldSmall}`}>
          <label className={styles.fieldLabel} htmlFor="workspace-niche">
            Niche
          </label>
          <input
            className={styles.surfaceInput}
            id="workspace-niche"
            onChange={(event) => onChange("niche", event.target.value)}
            placeholder="Ops"
            value={draft.niche}
          />
        </div>
      </div>

      <div className={styles.launchRow}>
        <p className={styles.panelHint}>
          {usage?.live_runs_limit
            ? `${usage.live_runs_today}/${usage.live_runs_limit} LIVE analyses used today.`
            : "Unlimited LIVE analyses are available on your current plan."}
        </p>

        <div className={styles.launchActions}>
          <button className={styles.secondaryAction} onClick={onOpenBlank} type="button">
            <Radar size={16} />
            Blank runner
          </button>
          <button className={styles.primaryAction} onClick={onLaunch} type="button">
            <ArrowUpRight size={16} />
            Open live runner
          </button>
        </div>
      </div>

      {message ? <div className={styles.statusBanner}>{message}</div> : null}
    </section>
  );
}

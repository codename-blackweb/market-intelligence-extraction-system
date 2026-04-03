import { compactUnique } from "@/lib/utils";
import type { AnalysisDisplayRecord, IntentMixSegment, PendingAnalysisDraft } from "@/lib/types";
import type { PersistedAnalysisRecord, PlanUsageSummary, UserPlan } from "@/types/market-analysis";

export const emptyPendingAnalysisDraft: PendingAnalysisDraft = {
  query: "",
  marketType: "",
  depth: "standard",
  competitorNames: "",
  competitorUrls: "",
  niche: ""
};

const defaultIntentMix: IntentMixSegment[] = [
  { label: "Problem", percentage: 30, tone: "aqua" },
  { label: "Solution", percentage: 36, tone: "cyan" },
  { label: "Evaluation", percentage: 24, tone: "amber" },
  { label: "Purchase", percentage: 10, tone: "emerald" }
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function toTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseConfidenceScore(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return clamp(parsed);
    }
  }

  return clamp(fallback);
}

function inferIntentKey(intentStage?: string) {
  const normalized = intentStage?.toLowerCase() ?? "";

  if (normalized.includes("problem")) {
    return "problem";
  }

  if (normalized.includes("solution") || normalized.includes("search")) {
    return "solution";
  }

  if (normalized.includes("evaluation") || normalized.includes("compare")) {
    return "evaluation";
  }

  if (normalized.includes("purchase") || normalized.includes("decision")) {
    return "purchase";
  }

  return "mixed";
}

export function estimateIntentMix(intentStage?: string): IntentMixSegment[] {
  switch (inferIntentKey(intentStage)) {
    case "problem":
      return [
        { label: "Problem", percentage: 52, tone: "aqua" },
        { label: "Solution", percentage: 24, tone: "cyan" },
        { label: "Evaluation", percentage: 16, tone: "amber" },
        { label: "Purchase", percentage: 8, tone: "emerald" }
      ];
    case "solution":
      return [
        { label: "Problem", percentage: 18, tone: "aqua" },
        { label: "Solution", percentage: 46, tone: "cyan" },
        { label: "Evaluation", percentage: 24, tone: "amber" },
        { label: "Purchase", percentage: 12, tone: "emerald" }
      ];
    case "evaluation":
      return [
        { label: "Problem", percentage: 12, tone: "aqua" },
        { label: "Solution", percentage: 24, tone: "cyan" },
        { label: "Evaluation", percentage: 42, tone: "amber" },
        { label: "Purchase", percentage: 22, tone: "emerald" }
      ];
    case "purchase":
      return [
        { label: "Problem", percentage: 8, tone: "aqua" },
        { label: "Solution", percentage: 16, tone: "cyan" },
        { label: "Evaluation", percentage: 24, tone: "amber" },
        { label: "Purchase", percentage: 52, tone: "emerald" }
      ];
    default:
      return defaultIntentMix;
  }
}

function buildAnalysisTags(record: PersistedAnalysisRecord) {
  const report = record.result_json;
  const depthLabel =
    record.depth === "deep" || report.synthesis_depth === "deep" ? "Deep" : "Standard";

  return compactUnique(
    [
      record.market_type,
      report.competitor_context.niche,
      depthLabel,
      report.source_meta.mode,
      report.classification.customer_type,
      report.classification.intent_stage
    ],
    5
  );
}

export function buildAnalysisDisplayRecord(record: PersistedAnalysisRecord): AnalysisDisplayRecord {
  const report = record.result_json;
  const signalCount =
    report.source_meta.google_signal_count +
    report.source_meta.reddit_signal_count +
    report.source_meta.youtube_signal_count +
    report.source_meta.amazon_signal_count +
    report.source_meta.news_signal_count +
    report.source_meta.competitor_signal_count;

  return {
    id: record.id,
    analysis: record,
    query: record.query,
    dominantNarrative: report.dominant_narrative,
    marketType:
      record.market_type ||
      report.market_diagnosis.market_type ||
      report.competitor_context.niche ||
      "Unclassified market",
    depth: record.depth || report.synthesis_depth || "standard",
    mode: report.source_meta.mode,
    isPublic: Boolean(record.is_public || record.shared_report?.is_public),
    createdAt: record.created_at,
    confidenceScore: parseConfidenceScore(
      report.confidence.confidence_score,
      report.signal_strength.confidence_score
    ),
    intentStage: report.classification.intent_stage || "Mixed intent",
    intentMix: estimateIntentMix(report.classification.intent_stage),
    signalCount,
    tags: buildAnalysisTags(record)
  };
}

export function selectPinnedAnalyses(records: AnalysisDisplayRecord[]) {
  return [...records]
    .sort((left, right) => {
      if (left.isPublic !== right.isPublic) {
        return left.isPublic ? -1 : 1;
      }

      if (left.confidenceScore !== right.confidenceScore) {
        return right.confidenceScore - left.confidenceScore;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, 2);
}

export function formatPlanLabel(plan: UserPlan | undefined) {
  if (plan === "agency") {
    return "Agency";
  }

  if (plan === "pro") {
    return "Pro";
  }

  return "Free";
}

export function formatAnalysisTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const deltaMs = timestamp - Date.now();
  const absMs = Math.abs(deltaMs);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < hour) {
    return formatter.format(Math.round(deltaMs / minute), "minute");
  }

  if (absMs < day) {
    return formatter.format(Math.round(deltaMs / hour), "hour");
  }

  return formatter.format(Math.round(deltaMs / day), "day");
}

export function calculateUsageSnapshot(usage?: PlanUsageSummary | null) {
  if (!usage) {
    return {
      heading: "Usage unavailable",
      progress: 0,
      detail: "Usage will appear when a workspace is connected.",
      meterLabel: "No telemetry"
    };
  }

  if (typeof usage.live_runs_limit !== "number" || usage.live_runs_limit <= 0) {
    return {
      heading: "Unlimited LIVE analyses",
      progress: 38,
      detail: `${usage.live_runs_today} runs today`,
      meterLabel: "Unlimited"
    };
  }

  const progress = clamp((usage.live_runs_today / usage.live_runs_limit) * 100);
  const remaining =
    typeof usage.live_runs_remaining === "number"
      ? `${usage.live_runs_remaining} remaining`
      : "Unlimited remaining";

  return {
    heading: `${usage.live_runs_today}/${usage.live_runs_limit} LIVE analyses`,
    progress,
    detail: remaining,
    meterLabel: remaining
  };
}

export function formatDepthLabel(depth: string) {
  return toTitle(depth);
}

export function formatVisibilityLabel(isPublic: boolean) {
  return isPublic ? "Public" : "Private";
}

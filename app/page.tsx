"use client";

import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Check,
  Layers3,
  MessageSquare,
  Search,
  Shield,
  Star,
  TriangleAlert,
  Zap
} from "lucide-react";
import AccountEntryButton from "@/components/auth/AccountEntryButton";
import ResultsCtaSection from "@/components/cta/ResultsCtaSection";
import FaqSection from "@/components/faq/FaqSection";
import { AuroraTextEffect } from "@/components/lightswind/aurora-text-effect";
import { useAuth } from "@/components/providers/AuthProvider";
import { BeamCircle } from "@/components/ui/beam-circle";
import {
  IntelligenceTimeline,
  type IntelligenceTimelineStep
} from "@/components/ui/intelligence-timeline";
import AnimatedPricingSection from "@/components/pricing/AnimatedPricingSection";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger
} from "@/components/lightswind/drawer";
import RippleLoader from "@/components/ui/RippleLoader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { ToggleTheme } from "@/components/ui/toggle-theme";
import { VideoText } from "@/components/ui/VideoText";
import {
  clearPendingAnalysisDraft,
  clearPendingAnalysisRestore,
  getOrCreateUserId,
  loadPendingAnalysisDraft,
  loadPendingAnalysisRestore,
  persistPendingPlan,
  persistStoredPlan
} from "@/lib/client-identity";
import { useMotionPolicy } from "@/lib/motion-policy";
import { FREE_LIVE_DAILY_LIMIT } from "@/lib/plan-config";
import type {
  CompetitorContext,
  GateType,
  GeneratedActionsResponse,
  GeneratedActionKind,
  MarketAnalysisResponse,
  MarketAnalysisSuccessResponse,
  MarketSourceMeta,
  NormalizedSignal,
  PlanUsageSummary,
  PersistedAnalysisRecord,
  SignalOriginEntry,
  UserPlan
} from "@/types/market-analysis";
import styles from "@/components/home/main-page-refinements.module.css";

const classificationRows = [
  ["Type", "core_type"],
  ["Model", "business_model"],
  ["Customer", "customer_type"],
  ["Intent", "intent_stage"],
  ["Behavior", "purchase_behavior"],
  ["Channel", "acquisition_channel"],
  ["Complexity", "value_complexity"],
  ["Risk", "risk_level"],
  ["Maturity", "market_maturity"],
  ["Competition", "competitive_structure"]
] as const;

const pipelineIntroLines = [
  "Collects search demand signals from the seed query.",
  "Clusters visible demand into interpretable themes.",
  "Classifies the market across models, customers, intent, and risk.",
  "Synthesizes pains, objections, acquisition angles, and messaging direction.",
  "Packages the output into an exportable intelligence report."
];

const pipelineTimelineSteps: IntelligenceTimelineStep[] = [
  {
    title: "Search Intelligence",
    time: "Step 01",
    description:
      "Collects search demand signals from the seed query across autocomplete, related searches, and visible question patterns.",
    icon: Search,
    accent: "#3b82f6"
  },
  {
    title: "Pattern Clustering",
    time: "Step 02",
    description:
      "Groups repeated phrases and visible demand signals into interpretable themes that reflect what the market is actually struggling with.",
    icon: Layers3,
    accent: "#7c3aed"
  },
  {
    title: "Market Classification",
    time: "Step 03",
    description:
      "Classifies the market across business model, customer type, intent level, complexity, maturity, and risk.",
    icon: Shield,
    accent: "#0f766e"
  },
  {
    title: "Strategic Synthesis",
    time: "Step 04",
    description:
      "Synthesizes pains, objections, acquisition angles, messaging direction, and positioning pressure points.",
    icon: Zap,
    accent: "#d97706"
  },
  {
    title: "Report Packaging",
    time: "Step 05",
    description:
      "Packages the output into a clean intelligence report designed for interpretation, export, and strategic use.",
    icon: Star,
    accent: "#059669"
  }
];

const intelligenceOutputTimelineSteps: IntelligenceTimelineStep[] = [
  {
    title: "Problems",
    time: "Output 01",
    description:
      "The repeated friction, complaints, bottlenecks, and pain patterns visible in the market.",
    icon: TriangleAlert,
    accent: "#dc2626"
  },
  {
    title: "Language",
    time: "Output 02",
    description:
      "The exact emotional wording, phrasing, and problem language people use when they describe what they want or what is failing.",
    icon: MessageSquare,
    accent: "#2563eb"
  },
  {
    title: "Keywords",
    time: "Output 03",
    description:
      "The clustered search phrases, repeated queries, and demand signals that reveal market intent.",
    icon: Search,
    accent: "#7c3aed"
  },
  {
    title: "Competitor Angles",
    time: "Output 04",
    description:
      "The positioning patterns, claims, and framing approaches visible across the market and adjacent competitors.",
    icon: Layers3,
    accent: "#0f766e"
  },
  {
    title: "Gaps",
    time: "Output 05",
    description:
      "The whitespace, under-addressed objections, and strategic opportunities the market is leaving exposed.",
    icon: Star,
    accent: "#d97706"
  },
  {
    title: "Strategy",
    time: "Output 06",
    description:
      "The recommended move, messaging direction, and usable strategic interpretation generated from the full signal set.",
    icon: Check,
    accent: "#059669"
  }
];

const RECENT_ANALYSES_STORAGE_KEY = "market-intelligence:recent-analyses:v1";
const USAGE_STATE_STORAGE_KEY = "market-intelligence:usage:v1";
const MAX_SAVED_RUNS = 10;
const CLIENT_MODE = ((process.env.NEXT_PUBLIC_MODE || "DEV").toUpperCase() as
  | "DEV"
  | "HYBRID"
  | "LIVE");
const STRIPE_CHECKOUT_URL = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";
const MARKET_CONTEXT_GROUPS = [
  {
    label: "Operational Niches",
    options: [
      "Demand Intelligence",
      "Search Data Infrastructure",
      "Trend Signal Detection",
      "Audience Intelligence",
      "Social Sentiment Monitoring",
      "AI Reasoning Systems",
      "Content Generation Systems"
    ]
  },
  {
    label: "Business Models",
    options: [
      "SaaS",
      "E-commerce",
      "Service",
      "Product",
      "Marketplace",
      "Agency"
    ]
  }
] as const;
const NICHE_OPTIONS = [
  "B2B SaaS",
  "Agency",
  "Local Service",
  "Healthcare",
  "Coaching",
  "E-commerce",
  "Fintech",
  "Education",
  "Other"
] as const;
const ACTION_BUTTONS: Array<{
  kind: GeneratedActionKind;
  label: string;
  title: string;
}> = [
  {
    kind: "positioning_statement",
    label: "Generate Positioning Statement",
    title: "Positioning Statement"
  },
  {
    kind: "ad_angles",
    label: "Generate Ad Angles",
    title: "Ad Angles"
  },
  {
    kind: "landing_page_hook",
    label: "Generate Landing Page Hook",
    title: "Landing Page Hook"
  },
  {
    kind: "email_angle",
    label: "Generate Email Angle",
    title: "Email Angle"
  }
];

type SuccessfulAnalysisResponse = Extract<MarketAnalysisResponse, { success: true }>;

type SavedAnalysisRun = {
  id: string;
  databaseId: string | null;
  isPublic: boolean;
  query: string;
  marketType: string;
  depth: string;
  createdAt: number;
  result: SuccessfulAnalysisResponse;
};

type UsageState = {
  userId: string | null;
  totalRuns: number;
  liveRunsToday: number;
  lastRunTimestamp: number | null;
  lastRunDay: string;
  plan: UserPlan;
  freeRunsRemaining: number;
};

type GatedAction = GateType | null;

type ActionOutputState = Partial<
  Record<
    GeneratedActionKind,
    {
      outputs: string[];
      fallbackUsed: boolean;
    }
  >
>;

function isSuccessfulAnalysisResponse(value: unknown): value is SuccessfulAnalysisResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { success?: boolean }).success === true &&
      typeof (value as { query?: unknown }).query === "string" &&
      typeof (value as { generatedAt?: unknown }).generatedAt === "string"
  );
}

function normalizeSourceMeta(meta?: Partial<MarketSourceMeta>): MarketSourceMeta {
  return {
    mode: meta?.mode === "HYBRID" || meta?.mode === "LIVE" ? meta.mode : "DEV",
    used_google: meta?.used_google ?? false,
    used_reddit: meta?.used_reddit ?? false,
    used_openai: meta?.used_openai ?? false,
    used_youtube: meta?.used_youtube ?? false,
    used_amazon: meta?.used_amazon ?? false,
    used_news: meta?.used_news ?? false,
    used_competitors: meta?.used_competitors ?? false,
    google_signal_count: meta?.google_signal_count ?? 0,
    reddit_signal_count: meta?.reddit_signal_count ?? 0,
    youtube_signal_count: meta?.youtube_signal_count ?? 0,
    amazon_signal_count: meta?.amazon_signal_count ?? 0,
    news_signal_count: meta?.news_signal_count ?? 0,
    competitor_signal_count: meta?.competitor_signal_count ?? 0
  };
}

function normalizeCompetitorContext(context?: Partial<CompetitorContext>): CompetitorContext {
  return {
    competitor_names: Array.isArray(context?.competitor_names)
      ? context.competitor_names.filter((item): item is string => typeof item === "string")
      : [],
    competitor_urls: Array.isArray(context?.competitor_urls)
      ? context.competitor_urls.filter((item): item is string => typeof item === "string")
      : [],
    niche: typeof context?.niche === "string" ? context.niche : ""
  };
}

function normalizeSignalOrigins(origins?: SignalOriginEntry[]) {
  if (!Array.isArray(origins)) {
    return [] as SignalOriginEntry[];
  }

  return origins
    .filter(
      (entry): entry is SignalOriginEntry =>
        Boolean(
          entry &&
            typeof entry.text === "string" &&
            Array.isArray(entry.sources)
        )
    )
    .map((entry) => ({
      text: entry.text,
      sources: entry.sources.filter((source): source is SignalOriginEntry["sources"][number] =>
        typeof source === "string"
      )
    }));
}

function normalizeSignals(signals?: NormalizedSignal[]) {
  if (!Array.isArray(signals)) {
    return [] as NormalizedSignal[];
  }

  return signals.filter(
    (signal): signal is NormalizedSignal =>
      Boolean(
        signal &&
          typeof signal.text === "string" &&
          typeof signal.source === "string" &&
          typeof signal.weight === "number"
      )
  );
}

function normalizeSuccessfulAnalysis(
  result: SuccessfulAnalysisResponse
): SuccessfulAnalysisResponse {
  return {
    ...result,
    normalized_signals: normalizeSignals(result.normalized_signals),
    signal_origins: normalizeSignalOrigins(result.signal_origins),
    source_meta: normalizeSourceMeta(result.source_meta),
    competitor_context: normalizeCompetitorContext(result.competitor_context),
    ai_confidence_score: result.ai_confidence_score ?? 0,
    synthesis_depth: result.synthesis_depth === "deep" ? "deep" : "standard",
    reasoning_quality:
      result.reasoning_quality === "high" || result.reasoning_quality === "low"
        ? result.reasoning_quality
        : "medium",
    fallback_used: result.fallback_used ?? false,
    analysis_id: typeof result.analysis_id === "string" ? result.analysis_id : null,
    analysis_is_public: Boolean(result.analysis_is_public),
    usage: result.usage
  };
}

function buildSignalSourceMap(origins: SignalOriginEntry[]) {
  const originMap = new Map<string, SignalOriginEntry["sources"]>();

  for (const origin of origins) {
    originMap.set(origin.text.toLowerCase(), origin.sources);
  }

  return originMap;
}

function formatEvidence(sourceMeta: MarketSourceMeta) {
  return `Derived from ${sourceMeta.google_signal_count} Google signals and ${sourceMeta.reddit_signal_count} Reddit threads.`;
}

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function resolveUsagePlan(state?: Partial<UsageState>, planOverride?: UserPlan): UserPlan {
  if (planOverride === "pro" || planOverride === "agency") {
    return planOverride;
  }

  if (state?.plan === "pro" || state?.plan === "agency") {
    return state.plan;
  }

  return "free";
}

function normalizeUsageState(
  state?: Partial<UsageState>,
  currentUserId?: string,
  planOverride?: UserPlan,
  usageOverride?: Partial<PlanUsageSummary>
): UsageState {
  const today = getTodayKey();
  const lastRunDay = typeof state?.lastRunDay === "string" ? state.lastRunDay : today;
  const storedUserId = typeof state?.userId === "string" && state.userId ? state.userId : null;
  const resolvedUserId = currentUserId || storedUserId;
  const hasUserMismatch = Boolean(currentUserId && storedUserId !== currentUserId);
  const plan = resolveUsagePlan(state, planOverride);
  const defaultFreeRunsRemaining = plan === "free" ? FREE_LIVE_DAILY_LIMIT : 0;
  const normalizedLiveRunsToday =
    typeof usageOverride?.live_runs_today === "number"
      ? usageOverride.live_runs_today
      : !hasUserMismatch &&
          typeof state?.liveRunsToday === "number" &&
          lastRunDay === today
        ? state.liveRunsToday
        : 0;

  return {
    userId: resolvedUserId,
    totalRuns:
      !hasUserMismatch && typeof state?.totalRuns === "number" ? state.totalRuns : 0,
    liveRunsToday: normalizedLiveRunsToday,
    lastRunTimestamp:
      !hasUserMismatch && typeof state?.lastRunTimestamp === "number"
        ? state.lastRunTimestamp
        : null,
    lastRunDay: hasUserMismatch ? today : lastRunDay,
    plan,
    freeRunsRemaining:
      plan === "free"
        ? typeof usageOverride?.live_runs_remaining === "number"
          ? Math.max(0, Math.min(FREE_LIVE_DAILY_LIMIT, usageOverride.live_runs_remaining))
          : !hasUserMismatch && typeof state?.freeRunsRemaining === "number"
            ? Math.max(0, Math.min(FREE_LIVE_DAILY_LIMIT, state.freeRunsRemaining))
            : defaultFreeRunsRemaining
        : 0
  };
}

function loadUsageState(
  currentUserId?: string,
  planOverride?: UserPlan,
  usageOverride?: Partial<PlanUsageSummary>
) {
  if (typeof window === "undefined") {
    return normalizeUsageState(undefined, currentUserId, planOverride, usageOverride);
  }

  const raw = window.localStorage.getItem(USAGE_STATE_STORAGE_KEY);

  if (!raw) {
    return normalizeUsageState(undefined, currentUserId, planOverride, usageOverride);
  }

  try {
    return normalizeUsageState(
      JSON.parse(raw) as Partial<UsageState>,
      currentUserId,
      planOverride,
      usageOverride
    );
  } catch {
    return normalizeUsageState(undefined, currentUserId, planOverride, usageOverride);
  }
}

function persistUsageState(state: UsageState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USAGE_STATE_STORAGE_KEY, JSON.stringify(state));
}

function formatGeneratedTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function getPricingMessage(gatedAction: GatedAction) {
  switch (gatedAction) {
    case "export":
      return "Full report export is a Pro feature";
    case "live_limit":
      return "Daily AI analysis limit reached";
    case "deep_synthesis":
      return "Deep synthesis is available on Pro";
    case "generator":
      return "Advanced generators are available on Pro";
    case "competitor_enrichment":
      return "Competitor enrichment is available on Pro";
    case "agency_only":
      return "This workflow is available on Agency";
    default:
      return "Unlock full intelligence";
  }
}

function getComparisonSignalSummary(result: SuccessfulAnalysisResponse) {
  return `${result.signal_strength.strength} • ${result.signal_strength.confidence_score}% • ${result.signal_strength.pattern_consistency}`;
}

function getClusterSummary(result: SuccessfulAnalysisResponse) {
  return result.clusters.clusters
    .map((cluster) => `${cluster.theme} (${cluster.frequency})`)
    .join(", ");
}

function savedRunFromPersisted(record: PersistedAnalysisRecord): SavedAnalysisRun {
  return {
    id: record.id,
    databaseId: record.id,
    isPublic: Boolean(record.is_public),
    query: record.query,
    marketType: record.market_type,
    depth: record.depth,
    createdAt: new Date(record.created_at).getTime(),
    result: normalizeSuccessfulAnalysis(record.result_json)
  };
}

function mergeSavedRuns(localRuns: SavedAnalysisRun[], remoteRuns: SavedAnalysisRun[]) {
  const merged = new Map<string, SavedAnalysisRun>();

  for (const run of [...remoteRuns, ...localRuns]) {
    const key = run.databaseId ?? `${run.query}-${run.createdAt}`;

    if (!merged.has(key)) {
      merged.set(key, run);
    }
  }

  return Array.from(merged.values())
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, MAX_SAVED_RUNS);
}

function loadSavedRuns() {
  if (typeof window === "undefined") {
    return [] as SavedAnalysisRun[];
  }

  const raw = window.localStorage.getItem(RECENT_ANALYSES_STORAGE_KEY);

  if (!raw) {
    return [] as SavedAnalysisRun[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as SavedAnalysisRun[];
    }

    return parsed
      .filter(
        (item): item is SavedAnalysisRun =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as { id?: unknown }).id === "string" &&
              typeof (item as { query?: unknown }).query === "string" &&
              typeof (item as { marketType?: unknown }).marketType === "string" &&
              typeof (item as { depth?: unknown }).depth === "string" &&
              typeof (item as { createdAt?: unknown }).createdAt === "number" &&
              isSuccessfulAnalysisResponse((item as { result?: unknown }).result)
          )
      )
      .map((item) => ({
        ...item,
        databaseId:
          typeof item.databaseId === "string" && item.databaseId ? item.databaseId : null,
        isPublic: Boolean(item.isPublic),
        result: normalizeSuccessfulAnalysis(item.result)
      }))
      .slice(0, MAX_SAVED_RUNS);
  } catch {
    return [] as SavedAnalysisRun[];
  }
}

function persistSavedRuns(runs: SavedAnalysisRun[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    RECENT_ANALYSES_STORAGE_KEY,
    JSON.stringify(runs.slice(0, MAX_SAVED_RUNS))
  );
}

function buildAuthHeaders(accessToken?: string, includeJson = false) {
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export default function Home() {
  const motionPolicy = useMotionPolicy();
  const { isAuthenticated, session, setPlan: setAuthPlan } = useAuth();
  const [query, setQuery] = useState("");
  const [marketType, setMarketType] = useState("");
  const [depth, setDepth] = useState("standard");
  const [competitorNames, setCompetitorNames] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [niche, setNiche] = useState("");
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<MarketAnalysisResponse | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedAnalysisRun[]>([]);
  const [usageState, setUsageState] = useState<UsageState>(normalizeUsageState());
  const [persistenceConfigured, setPersistenceConfigured] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeAnalysisPublic, setActiveAnalysisPublic] = useState(false);
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>([]);
  const [actionOutputs, setActionOutputs] = useState<ActionOutputState>({});
  const [actionLoadingKind, setActionLoadingKind] = useState<GeneratedActionKind | null>(null);
  const [actionError, setActionError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [hasCompletedFirstRun, setHasCompletedFirstRun] = useState(false);
  const [gatedAction, setGatedAction] = useState<GatedAction>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const analysisInputsRef = useRef<HTMLElement | null>(null);
  const queryInputRef = useRef<HTMLInputElement | null>(null);
  const pricingSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const localRuns = loadSavedRuns();
    const nextUserId = session?.user.id ?? getOrCreateUserId();
    const localUsage = loadUsageState(nextUserId);

    setUserId(nextUserId);
    setSavedRuns(localRuns);
    setUsageState(localUsage);
    setHasCompletedFirstRun(localRuns.length > 0);

    if (!session?.access_token) {
      setPersistenceConfigured(false);
      setWorkspaceId(null);
      return;
    }

    void (async () => {
      try {
        const accountResponse = await fetch("/api/account", {
          cache: "no-store",
          headers: buildAuthHeaders(session.access_token)
        });
        const accountJson = (await accountResponse.json()) as {
          success: boolean;
          persistenceConfigured?: boolean;
          subscription?: { plan?: UserPlan } | null;
          usage?: PlanUsageSummary | null;
          workspace?: { id?: string | null } | null;
          analyses?: PersistedAnalysisRecord[];
          error?: string;
        };

        if (!accountResponse.ok || !accountJson.success) {
          throw new Error(accountJson.error || "Unable to load account state.");
        }

        setPersistenceConfigured(Boolean(accountJson.persistenceConfigured));
        setWorkspaceId(accountJson.workspace?.id ?? null);

        const nextPlan =
          accountJson.usage?.plan === "pro" || accountJson.usage?.plan === "agency"
            ? accountJson.usage.plan
            : "free";
        const nextUsage = normalizeUsageState(localUsage, nextUserId, nextPlan, accountJson.usage ?? undefined);
        persistStoredPlan(nextPlan);
        persistUsageState(nextUsage);
        setUsageState(nextUsage);
        setAuthPlan(nextPlan);

        if (Array.isArray(accountJson.analyses)) {
          const remoteRuns = accountJson.analyses.map(savedRunFromPersisted);
          const mergedRuns = mergeSavedRuns(localRuns, remoteRuns);
          persistSavedRuns(mergedRuns);
          setSavedRuns(mergedRuns);
          if (mergedRuns.length) {
            setHasCompletedFirstRun(true);
          }
        }
      } catch {
        setPersistenceConfigured(false);
        setWorkspaceId(null);
      }
    })();
  }, [session?.access_token, session?.user.id, setAuthPlan]);

  useEffect(() => {
    const pendingDraft = loadPendingAnalysisDraft();

    if (!pendingDraft) {
      return;
    }

    setQuery(pendingDraft.query);
    setMarketType(pendingDraft.marketType);
    setDepth(pendingDraft.depth);
    setCompetitorNames(pendingDraft.competitorNames);
    setCompetitorUrls(pendingDraft.competitorUrls);
    setNiche(pendingDraft.niche);
    clearPendingAnalysisDraft();

    window.requestAnimationFrame(() => {
      analysisInputsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      window.setTimeout(() => {
        queryInputRef.current?.focus();
      }, 140);
    });
  }, []);

  const startUpgradeFlow = async (plan: Exclude<UserPlan, "free">) => {
    if (!STRIPE_CHECKOUT_URL) {
      setError("Billing checkout is not configured right now.");
      setGatedAction(plan === "agency" ? "agency_only" : null);
      return;
    }

    if (!isAuthenticated) {
      persistPendingPlan(plan);
      window.location.href = `/auth?plan=${encodeURIComponent(plan)}`;
      return;
    }

    persistPendingPlan(plan);
    window.location.href = STRIPE_CHECKOUT_URL;
  };

  const updateSavedRun = (databaseId: string, updater: (run: SavedAnalysisRun) => SavedAnalysisRun) => {
    setSavedRuns((currentRuns) => {
      const nextRuns = currentRuns.map((run) =>
        run.databaseId === databaseId ? updater(run) : run
      );
      persistSavedRuns(nextRuns);
      return nextRuns;
    });
  };

  const buildShareUrl = (analysisId: string) => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/analysis/${analysisId}`;
  };

  const restoreSavedRun = async (savedRun: SavedAnalysisRun) => {
    setQuery(savedRun.query);
    setMarketType(savedRun.marketType);
    setDepth(savedRun.depth);
    setCompetitorNames(savedRun.result.competitor_context.competitor_names.join("\n"));
    setCompetitorUrls(savedRun.result.competitor_context.competitor_urls.join("\n"));
    setNiche(savedRun.result.competitor_context.niche);
    setError("");
    setActionError("");
    setActionOutputs({});
    setShareMessage("");
    setGatedAction(null);

    if (savedRun.databaseId && session?.access_token) {
      try {
        const response = await fetch(`/api/analyses/${savedRun.databaseId}`, {
          cache: "no-store",
          headers: buildAuthHeaders(session.access_token)
        });
        const json = (await response.json()) as {
          success: boolean;
          analysis?: PersistedAnalysisRecord;
          error?: string;
        };

        if (response.ok && json.success && json.analysis) {
          const remoteRun = savedRunFromPersisted(json.analysis);
          updateSavedRun(remoteRun.databaseId ?? remoteRun.id, () => remoteRun);
          setActiveAnalysisId(remoteRun.databaseId);
          setActiveAnalysisPublic(remoteRun.isPublic);
          setHasCompletedFirstRun(true);
          setData(remoteRun.result);
          return;
        }
      } catch {
        // Fall through to the cached result.
      }
    }

    setActiveAnalysisId(savedRun.databaseId);
    setActiveAnalysisPublic(savedRun.isPublic);
    setHasCompletedFirstRun(true);
    setData(savedRun.result);
  };

  useEffect(() => {
    const pendingAnalysisId = loadPendingAnalysisRestore();

    if (!pendingAnalysisId) {
      return;
    }

    const pendingRun = savedRuns.find(
      (savedRun) => savedRun.databaseId === pendingAnalysisId || savedRun.id === pendingAnalysisId
    );

    if (!pendingRun) {
      return;
    }

    clearPendingAnalysisRestore();
    void restoreSavedRun(pendingRun);
  }, [savedRuns, session?.access_token]);

  const toggleCompareRun = (runId: string) => {
    setSelectedComparisonIds((currentIds) => {
      if (currentIds.includes(runId)) {
        return currentIds.filter((item) => item !== runId);
      }

      const nextIds = [...currentIds, runId];
      return nextIds.slice(-2);
    });
  };

  const runAnalysis = async (modeOverride?: "HYBRID") => {
    const requestMode = modeOverride ?? CLIENT_MODE;
    const hasCompetitorInputs =
      Boolean(competitorNames.trim().length) || Boolean(competitorUrls.trim().length);
    const liveLimitReached =
      usageState.plan === "free" &&
      requestMode === "LIVE" &&
      usageState.freeRunsRemaining <= 0;

    if (usageState.plan === "free" && depth !== "standard") {
      setGatedAction("deep_synthesis");
      setError("");
      return;
    }

    if (usageState.plan === "free" && hasCompetitorInputs) {
      setGatedAction("competitor_enrichment");
      setError("");
      return;
    }

    if (liveLimitReached) {
      setGatedAction("live_limit");
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setActionError("");
    setActionOutputs({});
    setShareMessage("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: buildAuthHeaders(session?.access_token, true),
        body: JSON.stringify({
          query,
          marketType,
          depth,
          competitorNames,
          competitorUrls,
          niche,
          modeOverride
        })
      });

      const json = (await res.json()) as MarketAnalysisResponse;
      console.log("analyze response", json);

      if (!json.success) {
        if ("gated" in json && json.gated && json.gate_type) {
          setGatedAction(json.gate_type);
          setError(json.message || json.error || "This action is gated on your current plan.");
          return;
        }

        console.error("analyze error", json.error);
        setError(json.error || "Something went wrong.");
        setData(null);
        return;
      }

      const normalized = normalizeSuccessfulAnalysis(json);
      setData(normalized);
      setGatedAction(null);
      setHasCompletedFirstRun(true);

      let savedRun: SavedAnalysisRun = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        databaseId: normalized.analysis_id ?? null,
        isPublic: Boolean(normalized.analysis_is_public),
        query: normalized.query,
        marketType,
        depth,
        createdAt: Date.now(),
        result: normalized
      };

      if (session?.access_token && !normalized.analysis_id) {
        try {
          const persistenceResponse = await fetch("/api/analyses", {
            method: "POST",
            headers: buildAuthHeaders(session.access_token, true),
            body: JSON.stringify({
              query: normalized.query,
              marketType,
              depth,
              result: normalized,
              workspaceId
            })
          });
          const persistenceJson = (await persistenceResponse.json()) as {
            success: boolean;
            persistenceConfigured?: boolean;
            analysis?: PersistedAnalysisRecord | null;
          };

          setPersistenceConfigured(Boolean(persistenceJson.persistenceConfigured));

          if (persistenceResponse.ok && persistenceJson.success && persistenceJson.analysis) {
            savedRun = savedRunFromPersisted(persistenceJson.analysis);
          }
        } catch {
          // Keep local-only save behavior if persistence is unavailable.
        }
      }

      setActiveAnalysisId(savedRun.databaseId);
      setActiveAnalysisPublic(savedRun.isPublic);

      setSavedRuns((currentRuns) => {
        const nextRuns = mergeSavedRuns(currentRuns, [savedRun]);
        persistSavedRuns(nextRuns);
        return nextRuns;
      });

      setUsageState((currentState) => {
        if (normalized.usage) {
          const nextState = normalizeUsageState(currentState, userId, normalized.usage.plan, normalized.usage);
          persistUsageState(nextState);
          return nextState;
        }

        const normalizedState = normalizeUsageState(currentState, userId);
        const nextState = normalizeUsageState(
          {
            ...normalizedState,
            totalRuns: normalizedState.totalRuns + 1,
            liveRunsToday:
              requestMode === "LIVE"
                ? normalizedState.liveRunsToday + 1
                : normalizedState.liveRunsToday,
            lastRunTimestamp: Date.now(),
            lastRunDay: getTodayKey(),
            freeRunsRemaining:
              normalizedState.plan === "free" && requestMode === "LIVE"
                ? Math.max(0, normalizedState.freeRunsRemaining - 1)
                : normalizedState.plan === "free"
                  ? normalizedState.freeRunsRemaining
                  : 0
          },
          userId,
          normalizedState.plan
        );
        persistUsageState(nextState);
        return nextState;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("analyze error", message);
      setError(message || "Something went wrong.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateActionOutput = async (kind: GeneratedActionKind) => {
    if (!data || !data.success) {
      return;
    }

    if (usageState.plan === "free") {
      setActionError("");
      setGatedAction("generator");
      return;
    }

    setActionLoadingKind(kind);
    setActionError("");

    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: buildAuthHeaders(session?.access_token, true),
        body: JSON.stringify({
          kind,
          analysis: data
        })
      });

      const json = (await response.json()) as GeneratedActionsResponse;

      if (!response.ok || !json.success) {
        if ("gated" in json && json.gated && json.gate_type) {
          setGatedAction(json.gate_type);
          setActionError(json.message || json.error || "This action is gated on your current plan.");
          return;
        }

        throw new Error("error" in json ? json.error : "Action generation failed.");
      }

      setActionOutputs((current) => ({
        ...current,
        [kind]: {
          outputs: json.outputs,
          fallbackUsed: json.fallback_used
        }
      }));
    } catch (actionGenerationError) {
      const message =
        actionGenerationError instanceof Error
          ? actionGenerationError.message
          : "Action generation failed.";
      setActionError(message);
    } finally {
      setActionLoadingKind(null);
    }
  };

  const exportPDF = async () => {
    const el = document.getElementById("report-export");

    if (!el) {
      return;
    }

    if (usageState.plan === "free") {
      setGatedAction("export");
      setShareMessage("");
      return;
    }

    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default;

    await html2pdf()
      .from(el)
      .set({
        margin: 10,
        filename: "market-intelligence-report.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .save();
  };

  const toggleShareVisibility = async () => {
    if (!activeAnalysisId || !session?.access_token) {
      setShareMessage("Share links require a persisted analysis.");
      return;
    }

    try {
      const response = await fetch(`/api/analyses/${activeAnalysisId}`, {
        method: "PATCH",
        headers: buildAuthHeaders(session.access_token, true),
        body: JSON.stringify({
          isPublic: !activeAnalysisPublic
        })
      });
      const json = (await response.json()) as {
        success: boolean;
        persistenceConfigured?: boolean;
        analysis?: PersistedAnalysisRecord | null;
        error?: string;
      };

      if (!response.ok || !json.success || !json.analysis) {
        throw new Error(json.error || "Unable to update share visibility.");
      }

      const updatedRun = savedRunFromPersisted(json.analysis);
      setPersistenceConfigured(Boolean(json.persistenceConfigured));
      setActiveAnalysisPublic(updatedRun.isPublic);
      updateSavedRun(activeAnalysisId, () => updatedRun);
      setShareMessage(updatedRun.isPublic ? "Share link ready." : "Analysis set to private.");
    } catch (shareError) {
      const message = shareError instanceof Error ? shareError.message : "Unable to update share visibility.";
      setShareMessage(message);
    }
  };

  const copyShareLink = async () => {
    if (!activeAnalysisId) {
      setShareMessage("Share links require a persisted analysis.");
      return;
    }

    if (!activeAnalysisPublic) {
      setShareMessage("Make this analysis public to copy its share link.");
      return;
    }

    const shareUrl = buildShareUrl(activeAnalysisId);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Share link copied.");
    } catch {
      setShareMessage(shareUrl);
    }
  };

  const openShareLink = () => {
    if (!activeAnalysisId) {
      setShareMessage("Share links require a persisted analysis.");
      return;
    }

    if (!activeAnalysisPublic) {
      setShareMessage("Make this analysis public to open its share link.");
      return;
    }

    window.open(buildShareUrl(activeAnalysisId), "_blank", "noopener,noreferrer");
  };

  const activeResult = data && data.success ? data : null;
  const freeAnalysisLimitReached =
    usageState.plan === "free" && usageState.freeRunsRemaining <= 0;
  const showInlinePricing =
    usageState.plan === "free" && Boolean(activeResult) && (hasCompletedFirstRun || gatedAction !== null);
  const showPricingModal =
    usageState.plan === "free" && !activeResult && gatedAction !== null;
  const pricingMessage = getPricingMessage(gatedAction);
  const signalSourceMap = activeResult
    ? buildSignalSourceMap(activeResult.signal_origins)
    : new Map<string, SignalOriginEntry["sources"]>();
  const comparisonRuns = selectedComparisonIds
    .map((runId) => savedRuns.find((savedRun) => savedRun.id === runId))
    .filter((savedRun): savedRun is SavedAnalysisRun => Boolean(savedRun));

  useEffect(() => {
    if (gatedAction && activeResult && pricingSectionRef.current) {
      pricingSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [activeResult, gatedAction]);

  const handlePlanSelection = async (plan: UserPlan) => {
    if (plan === "free") {
      setGatedAction(null);
      return;
    }

    await startUpgradeFlow(plan);
  };

  const scrollToAnalysisInputs = () => {
    analysisInputsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    window.setTimeout(() => {
      queryInputRef.current?.focus();
    }, 250);
  };

  return (
    <main className={`page-shell ${styles.pageShell}`} id="home">
      {loading && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center loader-overlay">
          <RippleLoader
            duration={motionPolicy.loaderDuration}
            icon={<Brain />}
            logoColor="black"
            size={motionPolicy.loaderSize}
          />
        </div>
      )}

      <div className="fixed top-6 right-6 z-50">
        <div className="flex items-center gap-3 top-right-controls">
          <div className="top-right-account-shell">
            <AccountEntryButton />
          </div>
          <ToggleTheme animationType="circle-spread" />
        </div>
      </div>

      <section className={`min-h-screen flex items-center justify-center ${styles.heroSection}`}>
        <div className={`text-center space-y-12 lg:space-y-16 hero-stack ${styles.heroStack}`}>
          <AuroraTextEffect
            className="hero-aurora-shell bg-transparent dark:bg-transparent"
            textClassName="hero-aurora-headline"
            fontSize={
              motionPolicy.isMobile
                ? "clamp(1.7rem, 8vw, 3rem)"
                : "clamp(2.85rem, 6vw, 6.2rem)"
            }
            text={
              motionPolicy.isMobile
                ? "TURN DEMAND\nSIGNALS INTO\nPREDICTABLE\nACQUISITION"
                : "TURN DEMAND SIGNALS\nINTO PREDICTABLE\nACQUISITION"
            }
          />
          <div className="hero-orbiter">
            <BeamCircle size={motionPolicy.isMobile ? 320 : 400} />
          </div>
          <div className="hero-subtitle-wrap mx-auto px-4 sm:px-6">
            <p className="hero-subtitle-copy mx-auto">
              See what the market is actually telling you — and know exactly what to do next.
            </p>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="max-w-7xl mx-auto px-6 py-20" id="run-analysis" ref={analysisInputsRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <input
                className="surface-input"
                ref={queryInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter seed query"
              />
            </div>

            <div className="card p-6">
              <p className={`card-label mb-3 ${styles.sectionPill}`}>Market Context (Optional)</p>
              <select
                className="surface-input"
                value={marketType}
                onChange={(event) => setMarketType(event.target.value)}
                aria-label="Market Context (Optional)"
              >
                <option value="">Select Market Context (Optional)</option>
                {MARKET_CONTEXT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="card p-6">
              <select
                className="surface-input"
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
              >
                <option value="standard">Standard Analysis</option>
                <option value="deep">Deep Analysis</option>
                <option value="aggressive">Aggressive (Max Insights)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card p-6">
              <textarea
                className="surface-input surface-textarea"
                value={competitorNames}
                onChange={(event) => setCompetitorNames(event.target.value)}
                placeholder="Optional competitor names"
                rows={4}
              />
            </div>

            <div className="card p-6">
              <textarea
                className="surface-input surface-textarea"
                value={competitorUrls}
                onChange={(event) => setCompetitorUrls(event.target.value)}
                placeholder="Optional competitor URLs"
                rows={4}
              />
            </div>

            <div className="card p-6">
              <select
                className="surface-input"
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
              >
                <option value="">Optional Market / Niche</option>
                {NICHE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className={`mt-10 ${styles.mainButton} ${styles.mainButtonPrimary}`}
            disabled={loading}
            onClick={() => runAnalysis()}
            type="button"
          >
            <VideoText
              as="span"
              src="/assets/gradient-video.mp4"
              className="button-video-text button-video-text-run"
              fontSize="1rem"
              fontWeight={700}
              fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
              textAnchor="middle"
              dominantBaseline="middle"
              autoPlay
              muted
              loop
              preload="auto"
            >
              Run Intelligence
            </VideoText>
          </button>

          {CLIENT_MODE === "LIVE" ? (
            <div className="usage-status-shell">
              <p className="field-copy result-copy">
                Plan:{" "}
                {usageState.plan === "agency"
                  ? "Agency"
                  : usageState.plan === "pro"
                    ? "Pro"
                    : "Free"}{" "}
                •{" "}
                {usageState.plan === "free"
                  ? `${usageState.freeRunsRemaining}/${FREE_LIVE_DAILY_LIMIT} LIVE runs left today`
                  : "Unlimited LIVE analyses"}
              </p>
              {freeAnalysisLimitReached ? (
                <p className="field-copy result-copy" role="status">
                  Unlock full intelligence to keep running LIVE analyses today
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="field-copy result-copy" role="alert">
              Error: {error}
            </p>
          ) : null}
        </section>
      </ScrollReveal>

      <section id="recent-analyses">
        {savedRuns.length ? (
          <ScrollReveal eager>
            <section className="max-w-7xl mx-auto px-6 pb-8 recent-analyses-shell">
              <div className="card p-6">
                <div className="recent-analyses-header">
                  <p className={`card-label ${styles.sectionPill}`}>Recent Analyses</p>
                  <p className="field-copy result-copy">
                    Select up to two saved runs to compare without rerunning the API.
                  </p>
                </div>
                <div className="recent-analyses-list">
                  {savedRuns.map((savedRun) => (
                    <article
                      className={`recent-analysis-item ${
                        selectedComparisonIds.includes(savedRun.id) ? "is-selected" : ""
                      }`}
                      key={savedRun.id}
                    >
                      <button
                        className="recent-analysis-button"
                        onClick={() => restoreSavedRun(savedRun)}
                        type="button"
                      >
                        <span className="recent-analysis-query">{savedRun.query}</span>
                        <span className="recent-analysis-meta">
                          {savedRun.result.source_meta.mode} • {formatGeneratedTimestamp(savedRun.createdAt)}
                          {savedRun.isPublic ? " • Public" : ""}
                        </span>
                      </button>
                      <button
                        className="recent-analysis-compare-button"
                        onClick={() => toggleCompareRun(savedRun.id)}
                        type="button"
                      >
                        {selectedComparisonIds.includes(savedRun.id) ? "Selected" : "Compare"}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        ) : null}
      </section>

      {comparisonRuns.length === 2 ? (
        <ScrollReveal eager>
          <section className="max-w-7xl mx-auto px-6 pb-8">
            <div className="card p-6 comparison-shell">
              <p className={`card-label ${styles.sectionPill}`}>Compare Runs</p>
              <div className="comparison-header">
                <div className="subcard">
                  <h3>{comparisonRuns[0].query}</h3>
                  <p>
                    {comparisonRuns[0].result.source_meta.mode} •{" "}
                    {formatGeneratedTimestamp(comparisonRuns[0].createdAt)}
                  </p>
                </div>
                <div className="subcard">
                  <h3>{comparisonRuns[1].query}</h3>
                  <p>
                    {comparisonRuns[1].result.source_meta.mode} •{" "}
                    {formatGeneratedTimestamp(comparisonRuns[1].createdAt)}
                  </p>
                </div>
              </div>

              <div className="comparison-grid">
                <div className="subcard">
                  <h3>Dominant Narrative</h3>
                  <p className="comparison-status">
                    {comparisonRuns[0].result.dominant_narrative ===
                    comparisonRuns[1].result.dominant_narrative
                      ? "Consistent"
                      : "Changed"}
                  </p>
                  <p>{comparisonRuns[0].result.dominant_narrative}</p>
                  <p>{comparisonRuns[1].result.dominant_narrative}</p>
                </div>

                <div className="subcard">
                  <h3>Signal Strength</h3>
                  <p className="comparison-status">
                    {getComparisonSignalSummary(comparisonRuns[0].result) ===
                    getComparisonSignalSummary(comparisonRuns[1].result)
                      ? "Consistent"
                      : "Changed"}
                  </p>
                  <p>{getComparisonSignalSummary(comparisonRuns[0].result)}</p>
                  <p>{getComparisonSignalSummary(comparisonRuns[1].result)}</p>
                </div>

                <div className="subcard">
                  <h3>Clusters</h3>
                  <p className="comparison-status">
                    {getClusterSummary(comparisonRuns[0].result) ===
                    getClusterSummary(comparisonRuns[1].result)
                      ? "Consistent"
                      : "Changed"}
                  </p>
                  <p>{getClusterSummary(comparisonRuns[0].result)}</p>
                  <p>{getClusterSummary(comparisonRuns[1].result)}</p>
                </div>

                <div className="subcard">
                  <h3>Market Gaps</h3>
                  <p className="comparison-status">
                    {comparisonRuns[0].result.market_gaps.join(" | ") ===
                    comparisonRuns[1].result.market_gaps.join(" | ")
                      ? "Consistent"
                      : "Changed"}
                  </p>
                  <ul className="result-list">
                    {comparisonRuns[0].result.market_gaps.map((gap) => (
                      <li key={`${comparisonRuns[0].id}-${gap}`}>{gap}</li>
                    ))}
                  </ul>
                  <ul className="result-list">
                    {comparisonRuns[1].result.market_gaps.map((gap) => (
                      <li key={`${comparisonRuns[1].id}-${gap}`}>{gap}</li>
                    ))}
                  </ul>
                </div>

                <div className="subcard">
                  <h3>Recommended Move</h3>
                  <p className="comparison-status">
                    {comparisonRuns[0].result.recommended_move ===
                    comparisonRuns[1].result.recommended_move
                      ? "Consistent"
                      : "Changed"}
                  </p>
                  <p>{comparisonRuns[0].result.recommended_move}</p>
                  <p>{comparisonRuns[1].result.recommended_move}</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      {activeResult && (
        <>
          <ScrollReveal eager>
            <section className="max-w-5xl mx-auto py-20 space-y-12">
              <div className="results-toolbar">
                <div className="results-toolbar-actions">
                  <button className="btn-secondary" onClick={exportPDF} type="button">
                    Export PDF
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={!activeAnalysisId}
                    onClick={() => void toggleShareVisibility()}
                    type="button"
                  >
                    {activeAnalysisPublic ? "Make Private" : "Make Public"}
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={!activeAnalysisId || !activeAnalysisPublic}
                    onClick={() => void copyShareLink()}
                    type="button"
                  >
                    Copy Link
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={!activeAnalysisId || !activeAnalysisPublic}
                    onClick={openShareLink}
                    type="button"
                  >
                    Open Link
                  </button>
                </div>
                <div className="results-toolbar-status">
                  <p className="field-copy result-copy">
                    {activeAnalysisId
                      ? activeAnalysisPublic
                        ? "This analysis is public and shareable."
                        : "This analysis is private."
                      : persistenceConfigured
                        ? "Saving locally while persistence completes."
                        : "Persistence is unavailable. Runs stay in local storage."}
                  </p>
                  {shareMessage ? (
                    <p className="field-copy result-copy" role="status">
                      {shareMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-12" id="report">
                <ScrollReveal eager>
                  <section className="card p-6">
                    <p className={`card-label ${styles.sectionPill}`}>Source Activity</p>
                    <div className="source-activity-strip" aria-label="Source activity">
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_google ? "is-active" : "is-inactive"
                        }`}
                      >
                        Google{" "}
                        <span aria-hidden="true">{activeResult.source_meta.used_google ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_reddit ? "is-active" : "is-inactive"
                        }`}
                      >
                        Reddit{" "}
                        <span aria-hidden="true">{activeResult.source_meta.used_reddit ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_openai ? "is-active" : "is-inactive"
                        }`}
                      >
                        OpenAI{" "}
                        <span aria-hidden="true">{activeResult.source_meta.used_openai ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_youtube ? "is-active" : "is-inactive"
                        }`}
                      >
                        YouTube{" "}
                        <span aria-hidden="true">{activeResult.source_meta.used_youtube ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_amazon ? "is-active" : "is-inactive"
                        }`}
                      >
                        Amazon{" "}
                        <span aria-hidden="true">{activeResult.source_meta.used_amazon ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_news ? "is-active" : "is-inactive"
                        }`}
                      >
                        News{" "}
                        <span aria-hidden="true">{activeResult.source_meta.used_news ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          activeResult.source_meta.used_competitors ? "is-active" : "is-inactive"
                        }`}
                      >
                        Competitors{" "}
                        <span aria-hidden="true">
                          {activeResult.source_meta.used_competitors ? "●" : "○"}
                        </span>
                      </span>
                    </div>
                    {activeResult.fallback_used ? (
                      <p className="evidence-note">Fallback synthesis used.</p>
                    ) : null}
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <p className={`card-label ${styles.sectionPill}`}>Dominant Narrative</p>
                    <p className="dominant-narrative-copy">{activeResult.dominant_narrative}</p>
                    <p className="evidence-note">{formatEvidence(activeResult.source_meta)}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Market Diagnosis</h2>
                    <div className="result-grid diagnosis-grid">
                      <div className="subcard">
                        <h3>Type</h3>
                        <p>{activeResult.market_diagnosis.market_type}</p>
                      </div>
                      <div className="subcard">
                        <h3>Demand</h3>
                        <p>{activeResult.market_diagnosis.demand_state}</p>
                      </div>
                      <div className="subcard">
                        <h3>Intent</h3>
                        <p>{activeResult.market_diagnosis.intent_level}</p>
                      </div>
                      <div className="subcard">
                        <h3>Risk</h3>
                        <p>{activeResult.market_diagnosis.risk_level}</p>
                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Signal Strength</h2>
                    <div
                      aria-hidden="true"
                      className="signal-strength-meter"
                    >
                      <span
                        className="signal-strength-meter-bar"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, activeResult.signal_strength.confidence_score)
                          )}%`
                        }}
                      />
                    </div>
                    <div className="result-grid breakdown-grid">
                      <div className="subcard">
                        <h3>Strength</h3>
                        <p>{activeResult.signal_strength.strength}</p>
                      </div>
                      <div className="subcard">
                        <h3>Confidence</h3>
                        <p>{activeResult.signal_strength.confidence_score}%</p>
                      </div>
                      <div className="subcard">
                        <h3>Pattern</h3>
                        <p>{activeResult.signal_strength.pattern_consistency}</p>
                      </div>
                    </div>
                    <p className="field-copy result-copy">{activeResult.confidence?.reason}</p>
                    <p className="evidence-note">
                      AI synthesis confidence {activeResult.ai_confidence_score}% • Depth{" "}
                      {activeResult.synthesis_depth} • Reasoning {activeResult.reasoning_quality}
                    </p>
                    <p className="evidence-note">{formatEvidence(activeResult.source_meta)}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Demand Clusters</h2>
                    <div className="stack">
                      {activeResult.clusters.clusters.map((cluster) => (
                        <div className="subcard" key={cluster.theme}>
                          <h3>
                            {cluster.theme} — {cluster.frequency} signals
                          </h3>
                          <ul className="result-list signal-list">
                            {cluster.queries.map((item) => (
                              <li className="signal-list-item" key={`${cluster.theme}-${item}`}>
                                <span>{item}</span>
                                <span className="signal-tag-row">
                                  {(signalSourceMap.get(item.toLowerCase()) ?? []).map((source) => (
                                    <span className="signal-origin-tag" key={`${item}-${source}`}>
                                      {source}
                                    </span>
                                  ))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="evidence-note">{formatEvidence(activeResult.source_meta)}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Market Gaps</h2>
                    <ul className="result-list">
                      {activeResult.market_gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                    <p className="evidence-note">{formatEvidence(activeResult.source_meta)}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Positioning Strategy</h2>
                    <div className="result-grid breakdown-grid">
                      <div className="subcard">
                        <h3>Emphasize</h3>
                        <ul className="result-list">
                          {activeResult.positioning_strategy.emphasize.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="subcard">
                        <h3>Avoid</h3>
                        <ul className="result-list">
                          {activeResult.positioning_strategy.avoid.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="subcard">
                        <h3>Blindspots</h3>
                        <ul className="result-list">
                          {activeResult.positioning_strategy.competitor_blindspots.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6 recommended-move-card">
                    <h2>Recommended Move</h2>
                    <p className="recommended-move-copy">{activeResult.recommended_move}</p>
                    <p className="evidence-note">{formatEvidence(activeResult.source_meta)}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Executive Summary</h2>
                    <ul className="result-list">
                      {activeResult.executive_summary.slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Confidence Score</h2>
                    <p>{activeResult.confidence?.confidence_score || "N/A"}</p>
                    <p>{activeResult.confidence?.reason}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Demand Clusters</h2>
                    <div className="result-grid single-column-results">
                      {activeResult.clusters?.clusters?.map((cluster) => (
                        <div className="subcard" key={cluster.theme}>
                          <h3>
                            {cluster.theme} — {cluster.frequency} signals
                          </h3>
                          <ul className="result-list signal-list">
                            {cluster.queries.map((item) => (
                              <li className="signal-list-item" key={`${cluster.theme}-repeat-${item}`}>
                                <span>{item}</span>
                                <span className="signal-tag-row">
                                  {(signalSourceMap.get(item.toLowerCase()) ?? []).map((source) => (
                                    <span className="signal-origin-tag" key={`${cluster.theme}-${item}-${source}`}>
                                      {source}
                                    </span>
                                  ))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Market Breakdown</h2>
                    <div className="result-grid breakdown-grid">
                      {classificationRows.map(([label, key]) => (
                        <div className="subcard" key={key}>
                          <h3>{label}</h3>
                          <p>{activeResult.classification?.[key]}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Core Constraint</h2>
                    <p>{activeResult.strategy?.core_constraint}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Customer Pains</h2>
                    <ul className="result-list">
                      {activeResult.strategy?.pains?.map((pain) => (
                        <li key={pain}>{pain}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Hidden Objections</h2>
                    <ul className="result-list">
                      {activeResult.strategy?.objections?.map((objection) => (
                        <li key={objection}>{objection}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Acquisition Angle</h2>
                    <p>{activeResult.strategy?.acquisition_angle}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Messaging Direction</h2>
                    <p>{activeResult.strategy?.messaging}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Offer Positioning</h2>
                    <p>{activeResult.strategy?.offer_positioning}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <p className={`card-label ${styles.sectionPill}`}>Action Outputs</p>
                    <div className="action-output-buttons">
                      {ACTION_BUTTONS.map((button) => (
                        <button
                          className="btn-secondary"
                          disabled={actionLoadingKind !== null}
                          key={button.kind}
                          onClick={() => generateActionOutput(button.kind)}
                          type="button"
                        >
                          {actionLoadingKind === button.kind ? "Generating..." : button.label}
                        </button>
                      ))}
                    </div>
                    {actionError ? (
                      <p className="field-copy result-copy" role="alert">
                        Error: {actionError}
                      </p>
                    ) : null}
                    <div className="result-grid single-column-results action-output-grid">
                      {ACTION_BUTTONS.filter((button) => actionOutputs[button.kind]).map((button) => (
                        <div className="subcard" key={`output-${button.kind}`}>
                          <h3>{button.title}</h3>
                          <ul className="result-list">
                            {actionOutputs[button.kind]?.outputs.map((item) => (
                              <li key={`${button.kind}-${item}`}>{item}</li>
                            ))}
                          </ul>
                          {actionOutputs[button.kind]?.fallbackUsed ? (
                            <p className="evidence-note">Fallback generation used.</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>
              </div>
            </section>
          </ScrollReveal>

        </>
      )}

      <section className="mt-24" id="pricing" ref={pricingSectionRef}>
        {showInlinePricing ? (
          <ScrollReveal eager>
            <section className="max-w-5xl mx-auto px-6 pb-8">
              <div className="card p-6 pricing-section-shell">
                <AnimatedPricingSection
                  currentPlan={usageState.plan}
                  focusState={gatedAction !== null}
                  message={pricingMessage}
                  onSelectPlan={(plan) => void handlePlanSelection(plan)}
                />
              </div>
            </section>
          </ScrollReveal>
        ) : null}
      </section>

      <section className="mt-24 faq-visibility-shell" id="faq">
        <ScrollReveal eager>
          <FaqSection />
        </ScrollReveal>
      </section>

      <section className="mt-16" id="bottom-cta">
        <ScrollReveal eager>
          <ResultsCtaSection
            onRunAnother={scrollToAnalysisInputs}
            onUpgrade={() => void handlePlanSelection("pro")}
            plan={usageState.plan}
          />
        </ScrollReveal>
      </section>

      {showPricingModal ? (
        <div
          className="pricing-modal-backdrop"
          onClick={() => setGatedAction(null)}
          role="presentation"
        >
          <div
            className="pricing-modal-panel card p-6"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={pricingMessage}
          >
            <AnimatedPricingSection
              currentPlan={usageState.plan}
              focusState
              message={pricingMessage}
              onSelectPlan={(plan) => void handlePlanSelection(plan)}
            />
          </div>
        </div>
      ) : null}

      {activeResult ? (
        <div aria-hidden="true" className="pdf-export-shell">
          <div className="pdf-export-document card" id="report-export">
            <section className="pdf-export-cover">
              <p className={`card-label ${styles.sectionPill}`}>Market Intelligence Report</p>
              <h1>{activeResult.query}</h1>
              <div className="pdf-export-meta">
                <span>Market Context: {marketType || activeResult.classification.core_type}</span>
                <span>Mode: {activeResult.source_meta.mode}</span>
                <span>{new Date(activeResult.generatedAt).toLocaleString()}</span>
              </div>
            </section>

            <section className="pdf-export-section">
              <h2>Executive Summary</h2>
              <ul className="result-list">
                {activeResult.executive_summary.slice(0, 4).map((item) => (
                  <li key={`export-summary-${item}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="pdf-export-section">
              <h2>Dominant Narrative</h2>
              <p className="dominant-narrative-copy">{activeResult.dominant_narrative}</p>
              <p className="evidence-note">{formatEvidence(activeResult.source_meta)}</p>
            </section>

            <section className="pdf-export-section">
              <h2>Signal Strength</h2>
              <div className="result-grid breakdown-grid">
                <div className="subcard">
                  <h3>Strength</h3>
                  <p>{activeResult.signal_strength.strength}</p>
                </div>
                <div className="subcard">
                  <h3>Confidence Score</h3>
                  <p>{activeResult.signal_strength.confidence_score}%</p>
                </div>
                <div className="subcard">
                  <h3>Pattern Consistency</h3>
                  <p>{activeResult.signal_strength.pattern_consistency}</p>
                </div>
              </div>
              <p className="field-copy result-copy">{activeResult.confidence.reason}</p>
            </section>

            <section className="pdf-export-section">
              <h2>Demand Clusters</h2>
              <div className="stack">
                {activeResult.clusters.clusters.map((cluster) => (
                  <div className="subcard" key={`export-${cluster.theme}`}>
                    <h3>
                      {cluster.theme} — {cluster.frequency} signals
                    </h3>
                    <ul className="result-list signal-list">
                      {cluster.queries.map((item) => (
                        <li className="signal-list-item" key={`export-${cluster.theme}-${item}`}>
                          <span>{item}</span>
                          <span className="signal-tag-row">
                            {(signalSourceMap.get(item.toLowerCase()) ?? []).map((source) => (
                              <span className="signal-origin-tag" key={`export-${item}-${source}`}>
                                {source}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-export-section">
              <h2>Market Gaps</h2>
              <ul className="result-list">
                {activeResult.market_gaps.map((gap) => (
                  <li key={`export-gap-${gap}`}>{gap}</li>
                ))}
              </ul>
            </section>

            <section className="pdf-export-section recommended-move-card">
              <h2>Recommended Move</h2>
              <p className="recommended-move-copy">{activeResult.recommended_move}</p>
            </section>

            <section className="pdf-export-section">
              <h2>Supporting Signals</h2>
              <ul className="result-list signal-list">
                {activeResult.signal_origins.map((signal) => (
                  <li className="signal-list-item" key={`export-origin-${signal.text}`}>
                    <span>{signal.text}</span>
                    <span className="signal-tag-row">
                      {signal.sources.map((source) => (
                        <span className="signal-origin-tag" key={`export-origin-${signal.text}-${source}`}>
                          {source}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      <ScrollReveal eager>
        <section className="max-w-5xl mx-auto px-6 pb-24 drawer-trigger-section">
          <Drawer>
            <DrawerTrigger className={`${styles.mainButton} ${styles.mainButtonSecondary}`} type="button">
              <VideoText
                as="span"
                src="/assets/gradient-video.mp4"
                className="button-video-text button-video-text-pipeline"
                fontSize="1rem"
                fontWeight={700}
                fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                textAnchor="middle"
                dominantBaseline="middle"
                autoPlay
                muted
                loop
                preload="auto"
              >
                How It Works
              </VideoText>
            </DrawerTrigger>

            <DrawerContent>
              <div className="drawer-grid-shell p-4">
                <div className="card p-6">
                  <div className={styles.drawerHeadingPill}>
                    <VideoText
                      as="h2"
                      src="/assets/gradient-video.mp4"
                      className={`drawer-video-heading drawer-video-heading-pipeline ${styles.drawerVideoHeading} ${styles.drawerVideoHeadingPipeline}`}
                      fontSize="clamp(1.28rem, 1.95vw, 1.58rem)"
                      fontWeight={700}
                      fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                      textAnchor="middle"
                      dominantBaseline="middle"
                      autoPlay
                      muted
                      loop
                      preload="auto"
                    >
                      Pipeline
                    </VideoText>
                  </div>
                  <div className="drawer-timeline-intro">
                    {pipelineIntroLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  <IntelligenceTimeline steps={pipelineTimelineSteps} />
                </div>

                <div className="card p-6">
                  <div className={styles.drawerHeadingPill}>
                    <VideoText
                      as="h2"
                      src="/assets/gradient-video.mp4"
                      className={`drawer-video-heading drawer-video-heading-output ${styles.drawerVideoHeading} ${styles.drawerVideoHeadingOutput}`}
                      fontSize="clamp(1.28rem, 1.95vw, 1.58rem)"
                      fontWeight={700}
                      fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                      textAnchor="middle"
                      dominantBaseline="middle"
                      autoPlay
                      muted
                      loop
                      preload="auto"
                    >
                      Intelligence Output
                    </VideoText>
                  </div>
                  <IntelligenceTimeline steps={intelligenceOutputTimelineSteps} />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </section>
      </ScrollReveal>
    </main>
  );
}

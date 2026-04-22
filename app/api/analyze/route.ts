import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { collectRedditCorpus } from "@/lib/reddit";
import { collectGoogleSignalBundle } from "@/lib/serpapi";
import {
  collectAmazonSignals,
  collectCompetitorSignals,
  collectNewsSignals,
  collectYouTubeSignals
} from "@/lib/source-expansion";
import { createPersistedAnalysis } from "@/lib/persistence";
import { buildGateResponse, getUserPlanUsage } from "@/lib/plan-capabilities";
import { getAuthenticatedRequestUser } from "@/lib/request-auth";
import { compactUnique, normalizeUrl, splitListInput } from "@/lib/utils";
import type {
  CompetitorContext,
  DemandCluster,
  MarketAnalysisResponse,
  MarketAnalysisSuccessResponse,
  MarketClassification,
  MarketClusters,
  MarketConfidence,
  MarketSignalStrength,
  MarketSourceMeta,
  MarketStrategy,
  MarketSynthesis,
  NormalizedSignal,
  SignalOriginEntry,
  SignalSourceTag
} from "@/types/market-analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DEV_MODE_DELAY_MS = 900;
const HYBRID_SUBREDDITS = ["marketing", "smallbusiness", "entrepreneur", "startups", "sales"];

type AnalyzeBody = {
  query?: string;
  seedQuery?: string;
  marketType?: string;
  depth?: string;
  workspaceId?: string | null;
  serpData?: unknown;
  competitorNames?: unknown;
  competitorUrls?: unknown;
  niche?: unknown;
  modeOverride?: unknown;
};

type DeterministicAnalysisOptions = {
  mode: MarketSourceMeta["mode"];
  query: string;
  marketType: string;
  googleSignals: Awaited<ReturnType<typeof collectGoogleSignalBundle>>;
  normalizedSignals: NormalizedSignal[];
  signalOrigins: SignalOriginEntry[];
  sourceMeta: MarketSourceMeta;
  competitorContext: CompetitorContext;
  synthesisDepth: "standard" | "deep";
  fallbackUsed?: boolean;
};

function buildSourceMeta(
  mode: MarketSourceMeta["mode"],
  overrides?: Partial<MarketSourceMeta>
): MarketSourceMeta {
  const defaults: Record<MarketSourceMeta["mode"], MarketSourceMeta> = {
    DEV: {
      mode: "DEV",
      used_google: true,
      used_reddit: true,
      used_openai: false,
      used_youtube: false,
      used_amazon: false,
      used_news: false,
      used_competitors: false,
      google_signal_count: 0,
      reddit_signal_count: 0,
      youtube_signal_count: 0,
      amazon_signal_count: 0,
      news_signal_count: 0,
      competitor_signal_count: 0
    },
    HYBRID: {
      mode: "HYBRID",
      used_google: true,
      used_reddit: true,
      used_openai: false,
      used_youtube: false,
      used_amazon: false,
      used_news: false,
      used_competitors: false,
      google_signal_count: 0,
      reddit_signal_count: 0,
      youtube_signal_count: 0,
      amazon_signal_count: 0,
      news_signal_count: 0,
      competitor_signal_count: 0
    },
    LIVE: {
      mode: "LIVE",
      used_google: true,
      used_reddit: true,
      used_openai: true,
      used_youtube: false,
      used_amazon: false,
      used_news: false,
      used_competitors: false,
      google_signal_count: 0,
      reddit_signal_count: 0,
      youtube_signal_count: 0,
      amazon_signal_count: 0,
      news_signal_count: 0,
      competitor_signal_count: 0
    }
  };

  return {
    ...defaults[mode],
    ...overrides
  };
}

function safeParse<T>(text: string) {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "text")
      .map((item) => item.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function mergeSignalOrigins(entries: SignalOriginEntry[]) {
  const originMap = new Map<
    string,
    {
      text: string;
      sources: Set<SignalSourceTag>;
    }
  >();

  for (const entry of entries) {
    const text = entry.text.trim();

    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    const current = originMap.get(key) ?? {
      text,
      sources: new Set<SignalSourceTag>()
    };

    for (const source of entry.sources) {
      current.sources.add(source);
    }

    originMap.set(key, current);
  }

  return Array.from(originMap.values()).map(({ text, sources }) => ({
    text,
    sources: Array.from(sources)
  }));
}

function buildSignalOriginEntries(values: string[], source: SignalSourceTag) {
  return values.map((text) => ({
    text,
    sources: [source]
  })) satisfies SignalOriginEntry[];
}

function normalizeCompetitorContext(body: AnalyzeBody): CompetitorContext {
  const competitorNames =
    typeof body.competitorNames === "string"
      ? splitListInput(body.competitorNames)
      : Array.isArray(body.competitorNames)
        ? compactUnique(
            body.competitorNames.filter((item): item is string => typeof item === "string"),
            12
          )
        : [];

  const competitorUrls =
    typeof body.competitorUrls === "string"
      ? compactUnique(
          splitListInput(body.competitorUrls)
            .map((value) => normalizeUrl(value))
            .filter((value): value is string => Boolean(value)),
          12
        )
      : Array.isArray(body.competitorUrls)
        ? compactUnique(
            body.competitorUrls
              .filter((item): item is string => typeof item === "string")
              .map((value) => normalizeUrl(value))
              .filter((value): value is string => Boolean(value)),
            12
          )
        : [];

  return {
    competitor_names: competitorNames,
    competitor_urls: competitorUrls,
    niche: typeof body.niche === "string" ? body.niche.trim() : ""
  };
}

function buildNormalizedSignals(values: string[], source: SignalSourceTag, weight: number) {
  return values.map((text) => ({
    text,
    source,
    weight
  })) satisfies NormalizedSignal[];
}

function mergeNormalizedSignals(signals: NormalizedSignal[]) {
  const signalMap = new Map<
    string,
    {
      text: string;
      sources: Set<SignalSourceTag>;
      weight: number;
    }
  >();

  for (const signal of signals) {
    const text = signal.text.trim();

    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    const current = signalMap.get(key) ?? {
      text,
      sources: new Set<SignalSourceTag>(),
      weight: 0
    };

    current.sources.add(signal.source);
    current.weight = Math.max(current.weight, signal.weight);
    signalMap.set(key, current);
  }

  return {
    normalizedSignals: Array.from(signalMap.values()).map(({ text, sources, weight }) => ({
      text,
      source: Array.from(sources)[0],
      weight
    })),
    signalOrigins: Array.from(signalMap.values()).map(({ text, sources }) => ({
      text,
      sources: Array.from(sources)
    }))
  };
}

async function collectUnifiedSignals(
  query: string,
  competitorContext: CompetitorContext,
  mode: MarketSourceMeta["mode"]
) {
  const googleSignals = await collectGoogleSignalBundle(query);
  const redditSignals = await collectHybridRedditSignals(query);

  const [youtubeSignals, amazonSignals, newsSignals, competitorSignals] =
    mode === "DEV"
      ? [[], [], [], []]
      : await Promise.all([
          collectYouTubeSignals(query),
          collectAmazonSignals(query),
          collectNewsSignals(query),
          collectCompetitorSignals(competitorContext.competitor_urls)
        ]);

  const { normalizedSignals, signalOrigins } = mergeNormalizedSignals([
    ...buildNormalizedSignals(googleSignals.autocomplete, "Autocomplete", 1),
    ...buildNormalizedSignals(googleSignals.paa, "PAA", 1.08),
    ...buildNormalizedSignals(googleSignals.related, "Related Searches", 0.96),
    ...buildNormalizedSignals(redditSignals, "Reddit", 1.12),
    ...youtubeSignals,
    ...amazonSignals,
    ...newsSignals,
    ...competitorSignals
  ]);

  return {
    googleSignals,
    redditSignals,
    youtubeSignals,
    amazonSignals,
    newsSignals,
    competitorSignals,
    normalizedSignals,
    signalOrigins,
    sourceMeta: buildSourceMeta(mode, {
      used_reddit: redditSignals.length > 0,
      used_youtube: youtubeSignals.length > 0,
      used_amazon: amazonSignals.length > 0,
      used_news: newsSignals.length > 0,
      used_competitors: competitorSignals.length > 0,
      google_signal_count: googleSignals.serpData.length,
      reddit_signal_count: redditSignals.length,
      youtube_signal_count: youtubeSignals.length,
      amazon_signal_count: amazonSignals.length,
      news_signal_count: newsSignals.length,
      competitor_signal_count: competitorSignals.length
    })
  };
}

function createMockAnalysisResponse(
  query: string,
  marketType: string,
  competitorContext: CompetitorContext
): MarketAnalysisSuccessResponse {
  const googleSignals = [
    "why is my business not growing",
    "how to get more customers",
    "stuck at same revenue",
    "how to get consistent leads",
    "how do i know if marketing is working"
  ];
  const redditSignals = [
    "marketing agency promises but no results",
    "small business lead gen feels unpredictable"
  ];
  const normalizedSignals = [
    ...buildNormalizedSignals(
      ["why is my business not growing", "how to get more customers"],
      "Autocomplete",
      1
    ),
    ...buildNormalizedSignals(
      ["stuck at same revenue", "how to get consistent leads"],
      "PAA",
      1.08
    ),
    ...buildNormalizedSignals(["how do i know if marketing is working"], "Related Searches", 0.96),
    ...buildNormalizedSignals(redditSignals, "Reddit", 1.12)
  ];
  const signalOrigins = mergeSignalOrigins([
    ...buildSignalOriginEntries(
      ["why is my business not growing", "how to get more customers"],
      "Autocomplete"
    ),
    ...buildSignalOriginEntries(
      ["stuck at same revenue", "how to get consistent leads"],
      "PAA"
    ),
    ...buildSignalOriginEntries(["how do i know if marketing is working"], "Related Searches"),
    ...buildSignalOriginEntries(redditSignals, "Reddit")
  ]);
  const competitiveGap =
    competitorContext.competitor_names[0] || competitorContext.competitor_urls[0]
      ? `There is whitespace to differentiate against ${
          competitorContext.competitor_names[0] ||
          new URL(competitorContext.competitor_urls[0]).hostname
        } with clearer acquisition proof.`
      : "There is whitespace to position around proof and predictability instead of abstract growth promises.";

  return {
    success: true,
    query,
    serpData: compactUnique([...googleSignals, ...redditSignals], 50),
    normalized_signals: normalizedSignals,
    signal_origins: signalOrigins,
    clusters: {
      clusters: [
        {
          theme: "Growth stagnation",
          frequency: 3,
          queries: [
            "why is my business not growing",
            "how to get more customers",
            "stuck at same revenue"
          ]
        },
        {
          theme: "Lead inconsistency",
          frequency: 2,
          queries: [
            "how to get consistent leads",
            "small business lead gen feels unpredictable"
          ]
        },
        {
          theme: "Trust and cost resistance",
          frequency: 2,
          queries: [
            "how do i know if marketing is working",
            "marketing agency promises but no results"
          ]
        }
      ]
    },
    dominant_narrative:
      "Demand is real, but buyers are screening for proof that growth can become predictable before they spend again.",
    market_diagnosis: {
      market_type: toDisplayMarketType(marketType),
      demand_state: "Active",
      intent_level: "Problem-Aware",
      risk_level: "Medium"
    },
    signal_strength: {
      strength: "High",
      confidence_score: 84,
      pattern_consistency: "Strong"
    },
    market_gaps: [
      "Most offers still promise growth without showing the operating system behind it.",
      "Very few competitors frame acquisition reliability as the real buying driver.",
      competitiveGap
    ],
    positioning_strategy: {
      emphasize: ["Predictable acquisition", "Signal visibility", "Proof-led execution"],
      avoid: ["Generic growth claims", "Agency hype", "Vanity metrics"],
      competitor_blindspots: [
        "Competitors over-index on activity instead of reliability.",
        "Most offers do not translate messy demand into a clear operating decision.",
        "Trust repair is under-addressed in category messaging."
      ]
    },
    recommended_move:
      "Sell predictable acquisition clarity and proof of signal visibility before promising scale.",
    executive_summary: [
      "Demand clusters around stalled growth, inconsistent leads, and trust erosion.",
      "The market is not asking for more tactics; it is asking for a more reliable acquisition system.",
      "Confidence is high because the same pain pattern repeats across search and discussion signals.",
      "Positioning should center on predictability, proof, and downside reduction."
    ],
    confidence: {
      confidence_score: 84,
      reason: "Deterministic mock synthesis built for DEV mode."
    },
    classification: {
      core_type: toDisplayMarketType(marketType),
      business_model: "Lead Generation",
      customer_type: "SMB",
      intent_stage: "Problem-Aware",
      purchase_behavior: "Considered",
      acquisition_channel: "Search",
      value_complexity: "Moderate",
      risk_level: "Medium",
      market_maturity: "Saturated",
      competitive_structure: "Fragmented"
    },
    strategy: {
      core_constraint:
        "The market is not lacking demand. It is lacking confidence in predictable acquisition.",
      pains: [
        "Inconsistent customer flow",
        "Wasted spend without clear attribution",
        "Uncertainty around what channel actually works"
      ],
      objections: [
        "This will be expensive",
        "I have tried marketing before and it did not work",
        "I do not trust agencies or generic growth advice"
      ],
      acquisition_angle:
        "Position the offer around predictable acquisition clarity instead of vague growth promises.",
      messaging:
        "Lead with certainty, signal visibility, and practical outcomes instead of hype.",
      offer_positioning:
        "A market intelligence and positioning system that turns messy demand into usable strategy."
    },
    source_meta: buildSourceMeta("DEV", {
      google_signal_count: googleSignals.length,
      reddit_signal_count: redditSignals.length
    }),
    competitor_context: competitorContext,
    ai_confidence_score: 78,
    synthesis_depth: "standard",
    reasoning_quality: "medium",
    fallback_used: false,
    generatedAt: new Date().toISOString()
  };
}

function toDisplayMarketType(marketType: string) {
  const cleaned = marketType.trim();
  const legacyLabels: Record<string, string> = {
    service: "Service",
    saas: "SaaS",
    ecommerce: "E-commerce",
    product: "Product",
    marketplace: "Marketplace",
    media: "Media",
    agency: "Agency",
    other: "Other"
  };

  if (!cleaned) {
    return "General";
  }

  const legacyMatch = legacyLabels[cleaned.toLowerCase()];

  if (legacyMatch) {
    return legacyMatch;
  }

  return cleaned;
}

async function collectHybridRedditSignals(query: string) {
  try {
    const corpus = await collectRedditCorpus(query, HYBRID_SUBREDDITS);

    return compactUnique(
      corpus.threads.map((thread) => thread.title.trim()).filter(Boolean),
      12
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("reddit fetch failed", message);
    return [];
  }
}

function createDeterministicAnalysisResponse({
  mode,
  query,
  marketType,
  googleSignals,
  normalizedSignals,
  signalOrigins,
  sourceMeta,
  competitorContext,
  synthesisDepth,
  fallbackUsed = false
}: DeterministicAnalysisOptions): MarketAnalysisSuccessResponse {
  const combinedSignals = compactUnique(normalizedSignals.map((signal) => signal.text), 50);
  const growthSignals = normalizedSignals.filter((signal) =>
    /grow|growth|revenue|customers|business not growing|traction/i.test(signal.text)
  );
  const leadSignals = normalizedSignals.filter(
    (signal) =>
      /lead|pipeline|prospect|customer flow|inbound|outbound/i.test(signal.text) &&
      !growthSignals.includes(signal)
  );
  const trustSignals = normalizedSignals.filter(
    (signal) =>
      /trust|expensive|cost|worth|agency|working|roi|overpromise|proof/i.test(signal.text) &&
      !growthSignals.includes(signal) &&
      !leadSignals.includes(signal)
  );
  const weightedSignalVolume = normalizedSignals.reduce((sum, signal) => sum + signal.weight, 0);

  const clusters = [
    growthSignals.length
      ? {
          theme: "Growth stagnation",
          frequency: growthSignals.length,
          queries: growthSignals.slice(0, 6).map((signal) => signal.text)
        }
      : null,
    leadSignals.length
      ? {
          theme: "Lead inconsistency",
          frequency: leadSignals.length,
          queries: leadSignals.slice(0, 6).map((signal) => signal.text)
        }
      : null,
    trustSignals.length
      ? {
          theme: "Trust and cost resistance",
          frequency: trustSignals.length,
          queries: trustSignals.slice(0, 6).map((signal) => signal.text)
        }
      : null
  ].filter((cluster): cluster is MarketClusters["clusters"][number] => Boolean(cluster));

  const normalizedClusters =
    clusters.length > 0
      ? clusters
      : [
          {
            theme: "Demand clarity",
            frequency: Math.max(1, combinedSignals.slice(0, 3).length),
            queries: combinedSignals.slice(0, 3)
          }
        ];

  const totalSignals = normalizedClusters.reduce((sum, cluster) => sum + cluster.frequency, 0);
  const leadCluster = normalizedClusters[0];
  const confidenceScore = Math.min(
    89,
    Math.max(72, 70 + Math.round(weightedSignalVolume) + Math.min(sourceMeta.reddit_signal_count, 5))
  );
  const patternConsistency =
    leadCluster.frequency >= 4 ? "Strong" : leadCluster.frequency >= 2 ? "Moderate" : "Fragmented";
  const signalStrength = totalSignals >= 9 ? "High" : totalSignals >= 5 ? "Medium" : "Low";
  const aiConfidenceScore = Math.min(
    92,
    Math.max(
      68,
      Math.round(
        confidenceScore +
          (mode === "LIVE" && !fallbackUsed ? 5 : 0) +
          (synthesisDepth === "deep" ? 3 : 0)
      )
    )
  );
  const reasoningQuality: MarketAnalysisSuccessResponse["reasoning_quality"] =
    aiConfidenceScore >= 86 ? "high" : aiConfidenceScore >= 76 ? "medium" : "low";
  const classification = {
    core_type: toDisplayMarketType(marketType || competitorContext.niche),
    business_model: "Lead Generation",
    customer_type: "SMB",
    intent_stage: "Problem-Aware",
    purchase_behavior: "Considered",
    acquisition_channel: "Search",
    value_complexity: "Moderate",
    risk_level: trustSignals.length >= 2 ? "High" : "Medium",
    market_maturity: totalSignals >= 9 ? "Saturated" : "Developing",
    competitive_structure:
      competitorContext.competitor_names.length || competitorContext.competitor_urls.length
        ? "Contested"
        : "Fragmented"
  } satisfies MarketClassification;
  const competitorReference =
    competitorContext.competitor_names[0] ||
    (competitorContext.competitor_urls[0]
      ? new URL(competitorContext.competitor_urls[0]).hostname
      : "");
  const strategy = {
    core_constraint:
      "The market is not lacking demand. It is lacking confidence in predictable acquisition.",
    pains: compactUnique(
      [
        growthSignals.length ? "Stalled growth despite active effort" : "",
        leadSignals.length ? "Inconsistent lead flow" : "",
        trustSignals.length ? "Low trust after expensive underperformance" : ""
      ].filter(Boolean),
      3
    ),
    objections: compactUnique(
      [
        trustSignals.length ? "This will be expensive without clear proof." : "",
        growthSignals.length ? "I have tried growth tactics before and nothing changed." : "",
        leadSignals.length ? "More leads will not help if quality stays inconsistent." : ""
      ].filter(Boolean),
      3
    ),
    acquisition_angle:
      "Position the offer around predictable acquisition clarity, not vague growth promises.",
    messaging: "Lead with certainty, visibility, and practical outcomes instead of hype.",
    offer_positioning:
      competitorReference
        ? `A decision system that makes acquisition clarity more defensible than ${competitorReference}.`
        : "A market intelligence system that turns live demand signals into clear growth decisions."
  } satisfies MarketStrategy;
  const competitorGap =
    competitorReference
      ? `There is room to out-position ${competitorReference} by tying proof and predictability together.`
      : "";

  return {
    success: true,
    query,
    serpData: combinedSignals,
    normalized_signals: normalizedSignals,
    signal_origins: signalOrigins,
    clusters: {
      clusters: normalizedClusters
    },
    dominant_narrative:
      leadCluster.theme === "Trust and cost resistance"
        ? "Demand is active, but buyers are screening hard for proof before they trust another growth promise."
        : leadCluster.theme === "Lead inconsistency"
          ? "The market is not asking for more activity; it is asking for acquisition reliability it can trust."
          : "The market is actively searching for a more predictable path out of stalled growth.",
    market_diagnosis: {
      market_type: classification.core_type,
      demand_state: signalStrength === "High" ? "Active" : "Emerging",
      intent_level: classification.intent_stage,
      risk_level: classification.risk_level
    },
    signal_strength: {
      strength: signalStrength,
      confidence_score: confidenceScore,
      pattern_consistency: patternConsistency
    },
    market_gaps: compactUnique(
      [
        "Most competitors still promise growth without proving the system behind it.",
        leadSignals.length
          ? "Few offers position around consistent lead quality instead of raw lead volume."
          : "",
        trustSignals.length
          ? "There is room for proof-led positioning that reduces perceived downside."
          : "The category leaves space for clearer acquisition visibility instead of vague channel talk.",
        competitorGap
      ].filter(Boolean),
      4
    ),
    positioning_strategy: {
      emphasize: compactUnique(
        [
          "Predictable acquisition",
          leadSignals.length ? "Lead quality consistency" : "Growth clarity",
          trustSignals.length ? "Proof-led trust" : "Operational visibility"
        ],
        3
      ),
      avoid: ["Generic growth claims", "Vague promises", "Agency hype"],
      competitor_blindspots: compactUnique(
        [
          "Most competitors underplay predictability as the purchase driver.",
          trustSignals.length
            ? "Most messaging ignores trust erosion caused by wasted spend."
            : "Most messaging fails to turn demand signals into usable guidance.",
          competitorReference
            ? `${competitorReference} does not own the narrative around acquisition certainty.`
            : "Few competitors translate visible demand into a clear operating decision."
        ],
        3
      )
    },
    recommended_move:
      leadCluster.theme === "Trust and cost resistance"
        ? "Anchor the offer around proof, visibility, and downside reduction before promising growth acceleration."
        : leadCluster.theme === "Lead inconsistency"
          ? "Lead with consistent pipeline quality and show how the offer makes acquisition reliability measurable."
          : "Position the offer as the clearest route from stalled growth to predictable acquisition.",
    executive_summary: compactUnique(
      [
        `${leadCluster.theme} is the dominant visible cluster with ${leadCluster.frequency} signals.`,
        `Signal strength reads ${signalStrength.toLowerCase()} at ${confidenceScore}% confidence.`,
        sourceMeta.reddit_signal_count
          ? "Reddit discussion reinforces the same acquisition and trust themes seen in search."
          : "Google demand signals are already concentrated enough to support a directional read.",
        sourceMeta.used_youtube
          ? "YouTube titles reinforce the same problem-aware framing visible in search."
          : "",
        sourceMeta.used_news
          ? "News coverage adds current context without displacing the core market pattern."
          : "",
        competitorReference
          ? `${competitorReference} creates a visible comparison point, but does not close the trust gap.`
          : "The best move is to sell certainty, visibility, and repeatability instead of generic growth promises."
      ],
      4
    ),
    confidence: {
      confidence_score: confidenceScore,
      reason:
        mode === "LIVE" && fallbackUsed
          ? "Fallback synthesis used after LIVE mode failed."
          : mode === "LIVE"
            ? "Built from live multi-source signals and structured AI synthesis."
            : "Built from live multi-source signals in deterministic mode."
    },
    classification,
    strategy,
    source_meta: {
      ...sourceMeta,
      used_openai: mode === "LIVE" && !fallbackUsed
    },
    competitor_context: competitorContext,
    ai_confidence_score: aiConfidenceScore,
    synthesis_depth: synthesisDepth,
    reasoning_quality: reasoningQuality,
    fallback_used: fallbackUsed,
    generatedAt: new Date().toISOString()
  };
}

function toCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value: unknown, limit = 12) {
  return compactUnique(
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
    limit
  );
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);

    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return 0;
}

function normalizeStrengthLabel(value: unknown): MarketSignalStrength["strength"] {
  const normalized = toCleanString(value).toLowerCase();

  if (normalized === "high") {
    return "High";
  }

  if (normalized === "low") {
    return "Low";
  }

  return "Medium";
}

function normalizePatternConsistencyLabel(
  value: unknown
): MarketSignalStrength["pattern_consistency"] {
  const normalized = toCleanString(value).toLowerCase();

  if (normalized === "strong") {
    return "Strong";
  }

  if (normalized === "fragmented") {
    return "Fragmented";
  }

  return "Moderate";
}

function normalizeReasoningQuality(
  value: unknown
): MarketAnalysisSuccessResponse["reasoning_quality"] {
  const normalized = toCleanString(value).toLowerCase();

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "low") {
    return "low";
  }

  return "medium";
}

function normalizeSynthesisDepth(
  value: unknown,
  fallback: MarketAnalysisSuccessResponse["synthesis_depth"]
): MarketAnalysisSuccessResponse["synthesis_depth"] {
  const normalized = toCleanString(value).toLowerCase();
  return normalized === "deep" ? "deep" : fallback;
}

function normalizeAiConfidenceScore(value: unknown, fallback: number) {
  const normalized = toNumber(value);
  return normalized ? Math.max(0, Math.min(100, normalized)) : fallback;
}

function normalizeClassificationPayload(
  value: unknown,
  fallback: MarketClassification
): MarketClassification {
  const classification = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    core_type: toCleanString(classification.core_type) || fallback.core_type,
    business_model: toCleanString(classification.business_model) || fallback.business_model,
    customer_type: toCleanString(classification.customer_type) || fallback.customer_type,
    intent_stage: toCleanString(classification.intent_stage) || fallback.intent_stage,
    purchase_behavior:
      toCleanString(classification.purchase_behavior) || fallback.purchase_behavior,
    acquisition_channel:
      toCleanString(classification.acquisition_channel) || fallback.acquisition_channel,
    value_complexity: toCleanString(classification.value_complexity) || fallback.value_complexity,
    risk_level: toCleanString(classification.risk_level) || fallback.risk_level,
    market_maturity: toCleanString(classification.market_maturity) || fallback.market_maturity,
    competitive_structure:
      toCleanString(classification.competitive_structure) || fallback.competitive_structure
  };
}

function normalizeStrategyPayload(value: unknown, fallback: MarketStrategy): MarketStrategy {
  const strategy = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const pains = toStringArray(strategy.pains);
  const objections = toStringArray(strategy.objections);

  return {
    core_constraint: toCleanString(strategy.core_constraint) || fallback.core_constraint,
    pains: pains.length ? pains : fallback.pains,
    objections: objections.length ? objections : fallback.objections,
    acquisition_angle: toCleanString(strategy.acquisition_angle) || fallback.acquisition_angle,
    messaging: toCleanString(strategy.messaging) || fallback.messaging,
    offer_positioning: toCleanString(strategy.offer_positioning) || fallback.offer_positioning
  };
}

function normalizeCluster(value: unknown): DemandCluster | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const cluster = value as Record<string, unknown>;
  const theme = toCleanString(cluster.theme);
  const queries = toStringArray(cluster.queries, 50);
  const frequency = toNumber(cluster.frequency) || queries.length;

  if (!theme) {
    return null;
  }

  return {
    theme,
    frequency,
    queries
  };
}

function normalizeClusters(value: unknown): MarketClusters {
  const source =
    value && typeof value === "object" && Array.isArray((value as { clusters?: unknown }).clusters)
      ? (value as { clusters: unknown[] }).clusters
      : [];

  return {
    clusters: source.map(normalizeCluster).filter((cluster): cluster is DemandCluster => Boolean(cluster))
  };
}

function normalizeSynthesis(
  value: unknown,
  fallbackClusters: MarketClusters,
  classification: MarketClassification
): MarketSynthesis {
  const synthesis = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const diagnosis =
    synthesis.market_diagnosis && typeof synthesis.market_diagnosis === "object"
      ? (synthesis.market_diagnosis as Record<string, unknown>)
      : {};
  const signalStrength =
    synthesis.signal_strength && typeof synthesis.signal_strength === "object"
      ? (synthesis.signal_strength as Record<string, unknown>)
      : {};
  const positioning =
    synthesis.positioning_strategy && typeof synthesis.positioning_strategy === "object"
      ? (synthesis.positioning_strategy as Record<string, unknown>)
      : {};
  const synthesizedClusters = normalizeClusters({ clusters: synthesis.clusters });

  return {
    dominant_narrative: toCleanString(synthesis.dominant_narrative),
    market_diagnosis: {
      market_type: toCleanString(diagnosis.market_type) || classification.core_type,
      demand_state: toCleanString(diagnosis.demand_state),
      intent_level: toCleanString(diagnosis.intent_level) || classification.intent_stage,
      risk_level: toCleanString(diagnosis.risk_level) || classification.risk_level
    },
    signal_strength: {
      strength: normalizeStrengthLabel(signalStrength.strength),
      confidence_score: toNumber(signalStrength.confidence_score),
      pattern_consistency: normalizePatternConsistencyLabel(
        signalStrength.pattern_consistency
      )
    },
    clusters: synthesizedClusters.clusters.length ? synthesizedClusters.clusters : fallbackClusters.clusters,
    core_constraint: toCleanString(synthesis.core_constraint),
    pains: toStringArray(synthesis.pains),
    objections: toStringArray(synthesis.objections),
    market_gaps: toStringArray(synthesis.market_gaps),
    positioning_strategy: {
      emphasize: toStringArray(positioning.emphasize),
      avoid: toStringArray(positioning.avoid),
      competitor_blindspots: toStringArray(positioning.competitor_blindspots)
    },
    recommended_move: toCleanString(synthesis.recommended_move),
    executive_summary: toStringArray(synthesis.executive_summary, 4)
  };
}

function deriveConfidence(signalStrength: MarketSignalStrength): MarketConfidence {
  return {
    confidence_score: signalStrength.confidence_score
      ? `${signalStrength.confidence_score}%`
      : "N/A",
    reason:
      signalStrength.pattern_consistency ||
      signalStrength.strength ||
      "Derived from the synthesis signal-strength pass."
  };
}

function deriveStrategy(synthesis: MarketSynthesis): MarketStrategy {
  const emphasize = synthesis.positioning_strategy.emphasize.join("; ");
  const blindspots = synthesis.positioning_strategy.competitor_blindspots.join("; ");

  return {
    core_constraint: synthesis.core_constraint,
    pains: synthesis.pains,
    objections: synthesis.objections,
    acquisition_angle: emphasize || synthesis.recommended_move,
    messaging: synthesis.dominant_narrative || synthesis.recommended_move,
    offer_positioning: blindspots || synthesis.recommended_move
  };
}

function getRuntimeConfig() {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const synthesisModel = process.env.OPENAI_SYNTHESIS_MODEL || process.env.OPENAI_ANALYSIS_MODEL;

  const missing = [
    !openAiApiKey ? "OPENAI_API_KEY" : null,
    !synthesisModel ? "OPENAI_SYNTHESIS_MODEL" : null
  ].filter((value): value is string => Boolean(value));

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}.`);
  }

  return {
    openAiApiKey: openAiApiKey!,
    synthesisModel: synthesisModel!
  };
}

async function runLiveOpenAiAnalysis({
  query,
  marketType,
  depth,
  googleSignals,
  normalizedSignals,
  signalOrigins,
  sourceMeta,
  competitorContext
}: {
  query: string;
  marketType: string;
  depth: string;
  googleSignals: Awaited<ReturnType<typeof collectGoogleSignalBundle>>;
  normalizedSignals: NormalizedSignal[];
  signalOrigins: SignalOriginEntry[];
  sourceMeta: MarketSourceMeta;
  competitorContext: CompetitorContext;
}): Promise<MarketAnalysisSuccessResponse> {
  const { openAiApiKey, synthesisModel } = getRuntimeConfig();
  const synthesisDepth = depth === "deep" || depth === "aggressive" ? "deep" : "standard";
  const baseline = createDeterministicAnalysisResponse({
    mode: "LIVE",
    query,
    marketType,
    googleSignals,
    normalizedSignals,
    signalOrigins,
    sourceMeta,
    competitorContext,
    synthesisDepth
  });

  if (!baseline.serpData.length) {
    throw new Error("serpData is required.");
  }

  const client = new OpenAI({
    apiKey: openAiApiKey
  });

  const synthesisPrompt = `
You are a senior market strategist.

Your job is to analyze real user demand and produce decisive, high-signal insights.

Internally perform three stages before answering:
1. Signal interpretation
2. Constraint extraction
3. Strategic synthesis

Do not expose your chain of thought. Return JSON only.

Return ONLY JSON in this exact format:

{
  "dominant_narrative": "",
  "market_diagnosis": {
    "market_type": "",
    "demand_state": "",
    "intent_level": "",
    "risk_level": ""
  },
  "signal_strength": {
    "strength": "",
    "confidence_score": 0,
    "pattern_consistency": ""
  },
  "clusters": [
    {
      "theme": "",
      "frequency": 0,
      "queries": []
    }
  ],
  "classification": {
    "core_type": "",
    "business_model": "",
    "customer_type": "",
    "intent_stage": "",
    "purchase_behavior": "",
    "acquisition_channel": "",
    "value_complexity": "",
    "risk_level": "",
    "market_maturity": "",
    "competitive_structure": ""
  },
  "strategy": {
    "core_constraint": "",
    "pains": [],
    "objections": [],
    "acquisition_angle": "",
    "messaging": "",
    "offer_positioning": ""
  },
  "market_gaps": [],
  "positioning_strategy": {
    "emphasize": [],
    "avoid": [],
    "competitor_blindspots": []
  },
  "recommended_move": "",
  "executive_summary": [],
  "ai_confidence_score": 0,
  "synthesis_depth": "${synthesisDepth}",
  "reasoning_quality": ""
}

Rules:
- Be decisive. No hedging.
- No fluff. No generic advice.
- Frequency must reflect repetition across queries.
- Dominant narrative must be one sharp sentence.
- Executive summary must be 3-4 bullets max.
- Positioning must be strategic, not vague.
- Recommended move must be a clear directive.
- Keep reasoning_quality to high, medium, or low.
- Keep ai_confidence_score between 0 and 100.
- Output valid JSON only.

Data:
NORMALIZED_SIGNALS:
${JSON.stringify(normalizedSignals, null, 2)}

SIGNAL_ORIGINS:
${JSON.stringify(signalOrigins, null, 2)}

COMPETITOR_CONTEXT:
${JSON.stringify(competitorContext, null, 2)}

DETERMINISTIC_BASELINE:
${JSON.stringify(baseline, null, 2)}
`;

  const synthesisRes = await client.responses.create({
    model: synthesisModel,
    input: synthesisPrompt
  });

  const synthesisText = extractOutputText(synthesisRes);
  const parsed = safeParse<Record<string, unknown>>(synthesisText);

  if (!parsed) {
    throw new Error("Synthesis model returned invalid JSON.");
  }

  const clusters = normalizeClusters({ clusters: parsed.clusters });
  const classification = normalizeClassificationPayload(parsed.classification, baseline.classification);
  const strategy = normalizeStrategyPayload(parsed.strategy, baseline.strategy);
  const synthesis = normalizeSynthesis(parsed, clusters.clusters.length ? clusters : baseline.clusters, classification);
  const confidence = {
    ...deriveConfidence(synthesis.signal_strength),
    reason: `Structured AI synthesis completed with ${normalizeReasoningQuality(
      parsed.reasoning_quality
    )} reasoning quality.`
  };

  if (!synthesis.dominant_narrative && !strategy.core_constraint && !synthesis.recommended_move) {
    throw new Error("Synthesis model returned invalid JSON.");
  }

  return {
    ...baseline,
    clusters: { clusters: synthesis.clusters },
    dominant_narrative: synthesis.dominant_narrative,
    market_diagnosis: synthesis.market_diagnosis,
    signal_strength: synthesis.signal_strength,
    market_gaps: synthesis.market_gaps,
    positioning_strategy: synthesis.positioning_strategy,
    recommended_move: synthesis.recommended_move,
    executive_summary: synthesis.executive_summary,
    confidence,
    classification,
    strategy,
    source_meta: {
      ...sourceMeta,
      used_openai: true
    },
    ai_confidence_score: normalizeAiConfidenceScore(parsed.ai_confidence_score, baseline.ai_confidence_score),
    synthesis_depth: normalizeSynthesisDepth(parsed.synthesis_depth, synthesisDepth),
    reasoning_quality: normalizeReasoningQuality(parsed.reasoning_quality),
    fallback_used: false,
    generatedAt: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    const MODE = (process.env.MODE || "DEV").toUpperCase();
    const body = (await request.json()) as AnalyzeBody;
    const auth = await getAuthenticatedRequestUser(request);
    const { query, seedQuery, marketType, depth } = body;
    const effectiveMode =
      typeof body.modeOverride === "string" && body.modeOverride.toUpperCase() === "HYBRID"
        ? "HYBRID"
        : MODE;
    const finalQuery = (query ?? "").trim() || (seedQuery ?? "").trim();
    const finalMarketType = (marketType ?? "").trim();
    const finalDepthCandidate = (depth ?? "").trim();
    const finalDepth =
      finalDepthCandidate === "deep" || finalDepthCandidate === "aggressive"
        ? finalDepthCandidate
        : "standard";
    const competitorContext = normalizeCompetitorContext(body);

    if (!finalQuery) {
      return NextResponse.json(
        { success: false, error: "Missing query" },
        { status: 400 }
      );
    }

    const attachPersistence = async (
      result: MarketAnalysisSuccessResponse
    ): Promise<MarketAnalysisSuccessResponse> => {
      if (!auth) {
        return result;
      }

      try {
        const persistedAnalysis = await createPersistedAnalysis({
          user_id: auth.user.id,
          workspace_id: typeof body.workspaceId === "string" ? body.workspaceId : null,
          query: result.query,
          market_type: finalMarketType,
          depth: finalDepth,
          result_json: result,
          accessToken: auth.accessToken
        });
        const nextPlanUsage = await getUserPlanUsage(auth.user.id, auth.accessToken);

        return {
          ...result,
          analysis_id: persistedAnalysis?.id ?? null,
          analysis_is_public: Boolean(persistedAnalysis?.is_public),
          usage: nextPlanUsage.usage
        };
      } catch (persistError) {
        console.warn(
          "analysis persistence attach failed",
          persistError instanceof Error ? persistError.message : persistError
        );
        return result;
      }
    };

    const hasCompetitorInputs =
      competitorContext.competitor_names.length > 0 || competitorContext.competitor_urls.length > 0;

    if (auth) {
      const { usage } = await getUserPlanUsage(auth.user.id, auth.accessToken);

      if (!usage.deep_synthesis_enabled && finalDepth !== "standard") {
        return NextResponse.json(
          buildGateResponse("deep_synthesis", "Deep synthesis is available on Pro."),
          { status: 403 }
        );
      }

      if (!usage.competitor_inputs_enabled && hasCompetitorInputs) {
        return NextResponse.json(
          buildGateResponse(
            "competitor_enrichment",
            "Competitor enrichment is available on Pro."
          ),
          { status: 403 }
        );
      }

      if (
        effectiveMode === "LIVE" &&
        typeof usage.live_runs_remaining === "number" &&
        usage.live_runs_remaining <= 0
      ) {
        return NextResponse.json(
          buildGateResponse("live_limit", "You have reached the free LIVE analysis limit for today."),
          { status: 403 }
        );
      }
    } else {
      if (finalDepth !== "standard") {
        return NextResponse.json(
          buildGateResponse("deep_synthesis", "Deep synthesis is available on Pro."),
          { status: 403 }
        );
      }

      if (hasCompetitorInputs) {
        return NextResponse.json(
          buildGateResponse(
            "competitor_enrichment",
            "Competitor enrichment is available on Pro."
          ),
          { status: 403 }
        );
      }
    }

    if (effectiveMode === "DEV") {
      await new Promise((resolve) => setTimeout(resolve, DEV_MODE_DELAY_MS));
      return NextResponse.json(
        createMockAnalysisResponse(finalQuery, finalMarketType, competitorContext)
      );
    }

    if (effectiveMode === "HYBRID") {
      const sourceBundle = await collectUnifiedSignals(finalQuery, competitorContext, "HYBRID");

      if (!sourceBundle.googleSignals.serpData.length) {
        throw new Error("serpData is required.");
      }

      const result = createDeterministicAnalysisResponse({
        mode: "HYBRID",
        query: finalQuery,
        marketType: finalMarketType,
        googleSignals: sourceBundle.googleSignals,
        normalizedSignals: sourceBundle.normalizedSignals,
        signalOrigins: sourceBundle.signalOrigins,
        sourceMeta: sourceBundle.sourceMeta,
        competitorContext,
        synthesisDepth: finalDepth === "deep" || finalDepth === "aggressive" ? "deep" : "standard"
      });

      return NextResponse.json(await attachPersistence(result));
    }

    const sourceBundle = await collectUnifiedSignals(finalQuery, competitorContext, "LIVE");

    if (!sourceBundle.googleSignals.serpData.length) {
      throw new Error("serpData is required.");
    }

    let liveError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await runLiveOpenAiAnalysis({
          query: finalQuery,
          marketType: finalMarketType,
          depth: finalDepth,
          googleSignals: sourceBundle.googleSignals,
          normalizedSignals: sourceBundle.normalizedSignals,
          signalOrigins: sourceBundle.signalOrigins,
          sourceMeta: sourceBundle.sourceMeta,
          competitorContext
        });

        return NextResponse.json(await attachPersistence(result));
      } catch (error) {
        liveError = error instanceof Error ? error : new Error("Unknown LIVE error");
        console.warn(`live analysis attempt ${attempt + 1} failed`, liveError.message);
      }
    }

    console.warn("live analysis failed, falling back to deterministic synthesis");

    const fallbackResult = createDeterministicAnalysisResponse({
      mode: "LIVE",
      query: finalQuery,
      marketType: finalMarketType,
      googleSignals: sourceBundle.googleSignals,
      normalizedSignals: sourceBundle.normalizedSignals,
      signalOrigins: sourceBundle.signalOrigins,
      sourceMeta: {
        ...sourceBundle.sourceMeta,
        used_openai: false
      },
      competitorContext,
      synthesisDepth: finalDepth === "deep" || finalDepth === "aggressive" ? "deep" : "standard",
      fallbackUsed: true
    });

    return NextResponse.json(await attachPersistence(fallbackResult));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Missing query" || message === "serpData is required." ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message
      } satisfies MarketAnalysisResponse,
      { status }
    );
  }
}

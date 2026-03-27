import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { collectRedditCorpus } from "@/lib/reddit";
import { compactUnique } from "@/lib/utils";
import { buildNormalizedSerpData } from "@/lib/serpapi";
import type {
  MarketAnalysisResponse,
  MarketClusters,
  MarketClassification,
  MarketConfidence,
  MarketStrategy,
  MarketSynthesis,
  DemandCluster,
  MarketSignalStrength
} from "@/types/market-analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DEV_MODE_DELAY_MS = 900;
const HYBRID_SUBREDDITS = ["marketing", "smallbusiness", "entrepreneur", "startups", "sales"];

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

function normalizePayload(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;
  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  const seedQuery = typeof payload.seedQuery === "string" ? payload.seedQuery.trim() : "";
  const finalQuery = query || seedQuery;
  const marketType = typeof payload.marketType === "string" ? payload.marketType.trim() : "";
  const depthCandidate = typeof payload.depth === "string" ? payload.depth.trim() : "";
  const depth =
    depthCandidate === "deep" || depthCandidate === "aggressive" ? depthCandidate : "standard";

  if (!finalQuery) {
    throw new Error("Missing query");
  }

  const serpData = compactUnique(
    Array.isArray(payload.serpData)
      ? payload.serpData.filter((item): item is string => typeof item === "string")
      : [],
    50
  );

  return {
    seedQuery,
    query: finalQuery,
    marketType,
    depth,
    serpData
  };
}

function createMockAnalysisResponse(
  query: string,
  _marketType: string
): Extract<MarketAnalysisResponse, { success: true }> {
  const mockClusters = {
    clusters: [
      {
        theme: "Growth stagnation",
        frequency: 3,
        queries: [
          "why is my business not growing",
          "how to get more customers",
          "stuck at same revenue"
        ]
      }
    ]
  } satisfies MarketClusters;

  const classification = {
    core_type: "Service",
    business_model: "Lead Generation",
    customer_type: "SMB",
    intent_stage: "Problem-Aware",
    purchase_behavior: "Considered",
    acquisition_channel: "Search",
    value_complexity: "Moderate",
    risk_level: "Medium",
    market_maturity: "Saturated",
    competitive_structure: "Fragmented"
  } satisfies MarketClassification;

  const strategy = {
    core_constraint: "Lack of predictable acquisition",
    pains: ["inconsistent leads"],
    objections: ["too expensive"],
    acquisition_angle: "predictability",
    messaging: "clarity over hype",
    offer_positioning: "intelligence-driven growth"
  } satisfies MarketStrategy;

  const confidence = {
    confidence_score: 84,
    reason: "Mock data (DEV mode)"
  } satisfies MarketConfidence;

  return {
    success: true,
    query,
    serpData: mockClusters.clusters.flatMap((cluster) => cluster.queries),
    clusters: mockClusters,
    dominant_narrative:
      "Demand is clustering around stalled growth and the need for predictable acquisition.",
    market_diagnosis: {
      market_type: classification.core_type,
      demand_state: "Active",
      intent_level: "Problem-Aware",
      risk_level: "Medium"
    },
    signal_strength: {
      strength: "High",
      confidence_score: 84,
      pattern_consistency: "Mock data (DEV mode)"
    },
    market_gaps: [
      "Most offers do not frame growth around predictable acquisition systems.",
      "Search demand suggests a gap for practical clarity instead of hype-led messaging.",
      "There is room for an offer centered on intelligence-driven growth decisions."
    ],
    positioning_strategy: {
      emphasize: [
        "Predictable acquisition",
        "Operational clarity",
        "Measured growth decisions"
      ],
      avoid: [
        "Generic growth claims",
        "Vague promises",
        "Agency hype"
      ],
      competitor_blindspots: [
        "Most competitors underplay predictability as the core purchase driver.",
        "Most messaging ignores trust erosion from inconsistent results.",
        "Most offers do not translate search demand into actionable strategy."
      ]
    },
    recommended_move:
      "Position the product around predictable acquisition and clarity over hype.",
    executive_summary: [
      "Demand exists, but buyers want more predictability.",
      "Growth stagnation is the dominant visible query cluster.",
      "Trust is fragile when outcomes feel inconsistent.",
      "Positioning should center on clarity and intelligence-driven decisions."
    ],
    confidence,
    classification,
    strategy,
    generatedAt: new Date().toISOString()
  };
}

function toDisplayMarketType(marketType: string) {
  if (!marketType) {
    return "Service";
  }

  return marketType.charAt(0).toUpperCase() + marketType.slice(1).toLowerCase();
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
    console.warn("hybrid reddit fetch failed", message);
    return [];
  }
}

function createHybridAnalysisResponse(
  query: string,
  marketType: string,
  serpData: string[],
  redditSignals: string[]
): Extract<MarketAnalysisResponse, { success: true }> {
  const combinedSignals = compactUnique([...serpData, ...redditSignals], 24);
  const growthSignals = combinedSignals.filter((signal) =>
    /grow|growth|revenue|customers|business not growing|traction/i.test(signal)
  );
  const leadSignals = combinedSignals.filter(
    (signal) =>
      /lead|pipeline|prospect|customer flow|inbound|outbound/i.test(signal) &&
      !growthSignals.includes(signal)
  );
  const trustSignals = combinedSignals.filter(
    (signal) =>
      /trust|expensive|cost|worth|agency|working|roi|overpromise/i.test(signal) &&
      !growthSignals.includes(signal) &&
      !leadSignals.includes(signal)
  );

  const clusters = [
    growthSignals.length
      ? {
          theme: "Growth stagnation",
          frequency: growthSignals.length,
          queries: growthSignals.slice(0, 6)
        }
      : null,
    leadSignals.length
      ? {
          theme: "Lead inconsistency",
          frequency: leadSignals.length,
          queries: leadSignals.slice(0, 6)
        }
      : null,
    trustSignals.length
      ? {
          theme: "Trust and cost resistance",
          frequency: trustSignals.length,
          queries: trustSignals.slice(0, 6)
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

  const totalSignals = normalizedClusters.reduce(
    (sum, cluster) => sum + cluster.frequency,
    0
  );
  const leadCluster = normalizedClusters[0];
  const confidenceScore = Math.min(
    89,
    Math.max(72, 72 + totalSignals + Math.min(redditSignals.length, 5))
  );
  const patternConsistency =
    leadCluster.frequency >= 4 ? "Strong" : leadCluster.frequency >= 2 ? "Moderate" : "Fragmented";
  const signalStrength = totalSignals >= 9 ? "High" : totalSignals >= 5 ? "Medium" : "Low";
  const classification = {
    core_type: toDisplayMarketType(marketType),
    business_model: "Lead Generation",
    customer_type: "SMB",
    intent_stage: "Problem-Aware",
    purchase_behavior: "Considered",
    acquisition_channel: "Search",
    value_complexity: "Moderate",
    risk_level: trustSignals.length >= 2 ? "High" : "Medium",
    market_maturity: totalSignals >= 9 ? "Saturated" : "Developing",
    competitive_structure: "Fragmented"
  } satisfies MarketClassification;
  const strategy = {
    core_constraint: "The market is not lacking demand. It is lacking confidence in predictable acquisition.",
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
    acquisition_angle: "Position the offer around predictable acquisition clarity, not vague growth promises.",
    messaging: "Lead with certainty, visibility, and practical outcomes instead of hype.",
    offer_positioning: "A market intelligence system that turns live demand signals into clear growth decisions."
  } satisfies MarketStrategy;

  return {
    success: true,
    query,
    serpData,
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
          : "The category leaves space for clearer acquisition visibility instead of vague channel talk."
      ].filter(Boolean),
      3
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
          "Few competitors translate visible demand into a clear operating decision."
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
        redditSignals.length
          ? "Reddit discussion reinforces the same acquisition and trust themes seen in search."
          : "Google demand signals are already concentrated enough to support a directional read.",
        "The best move is to sell certainty, visibility, and repeatability instead of generic growth promises."
      ],
      4
    ),
    confidence: {
      confidence_score: confidenceScore,
      reason: "Built from live Google and Reddit signals in HYBRID mode."
    },
    classification,
    strategy,
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
      strength: toCleanString(signalStrength.strength),
      confidence_score: toNumber(signalStrength.confidence_score),
      pattern_consistency: toCleanString(signalStrength.pattern_consistency)
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
  const serpApiKey = process.env.SERPAPI_KEY;
  const analysisModel = process.env.OPENAI_ANALYSIS_MODEL;
  const synthesisModel = process.env.OPENAI_SYNTHESIS_MODEL;

  const missing = [
    !openAiApiKey ? "OPENAI_API_KEY" : null,
    !serpApiKey ? "SERPAPI_KEY" : null,
    !analysisModel ? "OPENAI_ANALYSIS_MODEL" : null,
    !synthesisModel ? "OPENAI_SYNTHESIS_MODEL" : null
  ].filter((value): value is string => Boolean(value));

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}.`);
  }

  return {
    openAiApiKey: openAiApiKey!,
    analysisModel: analysisModel!,
    synthesisModel: synthesisModel!
  };
}

export async function POST(request: NextRequest) {
  try {
    const MODE = (process.env.MODE || "DEV").toUpperCase();
    const body = await request.json();
    const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const query = typeof payload.query === "string" ? payload.query.trim() : "";
    const seedQuery = typeof payload.seedQuery === "string" ? payload.seedQuery.trim() : "";
    const marketType = typeof payload.marketType === "string" ? payload.marketType.trim() : "";
    const depth = typeof payload.depth === "string" ? payload.depth.trim() : "";
    const finalQuery = query || seedQuery;
    const providedSerpData = compactUnique(
      Array.isArray(payload.serpData)
        ? payload.serpData.filter((item): item is string => typeof item === "string")
        : [],
      50
    );

    console.log("MODE:", MODE);
    console.log("analyze request:", { query, seedQuery, marketType, depth });

    if (!finalQuery) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing query"
        } satisfies MarketAnalysisResponse,
        { status: 400 }
      );
    }

    if (MODE === "DEV") {
      await new Promise((resolve) => setTimeout(resolve, DEV_MODE_DELAY_MS));
      return NextResponse.json(createMockAnalysisResponse(finalQuery, marketType));
    }

    if (MODE === "HYBRID") {
      console.log("ENTERED HYBRID BRANCH");
      const serpData = providedSerpData.length
        ? providedSerpData
        : await buildNormalizedSerpData(finalQuery);

      if (!serpData.length) {
        throw new Error("serpData is required.");
      }

      const redditSignals = await collectHybridRedditSignals(finalQuery);

      return NextResponse.json(
        createHybridAnalysisResponse(finalQuery, marketType, serpData, redditSignals)
      );
    }

    console.log("ENTERING LIVE OPENAI BRANCH");

    const { openAiApiKey, analysisModel, synthesisModel } = getRuntimeConfig();
    const serpData = providedSerpData.length
      ? providedSerpData
      : await buildNormalizedSerpData(finalQuery);

    if (!serpData.length) {
      throw new Error("serpData is required.");
    }

    const client = new OpenAI({
      apiKey: openAiApiKey
    });

    const analysisPrompt = `
You are a market intelligence system.

Given real user search queries, classify the market dynamics.

Return ONLY JSON in this format:

{
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
}

Queries:
${JSON.stringify(serpData)}

Market Type:
${marketType || "unspecified"}

Analysis Depth:
${depth}

Rules:
- Infer from patterns
- Be decisive
- No explanations
`;

    const clusteringPrompt = `
Cluster queries into themes.

Return JSON:
{
  "clusters": [
    {
      "theme": "",
      "frequency": 0,
      "queries": []
    }
  ]
}

Queries:
${JSON.stringify(serpData)}

Rules:
- Count frequency explicitly
- Max 6 clusters
- Group by intent, not keywords
`;

    const [analysisRes, clusteringRes] = await Promise.all([
      client.responses.create({
        model: analysisModel,
        input: analysisPrompt
      }),
      client.responses.create({
        model: analysisModel,
        input: clusteringPrompt
      })
    ]);

    const classificationText = extractOutputText(analysisRes);
    const classification = safeParse<MarketClassification>(classificationText);

    if (!classification) {
      throw new Error("Analysis model returned invalid JSON.");
    }

    const clusteringText = extractOutputText(clusteringRes);
    const clusters = normalizeClusters(safeParse<MarketClusters>(clusteringText));

    if (!clusters.clusters.length) {
      throw new Error("Clustering model returned invalid JSON.");
    }

    const synthesisPrompt = `
You are a senior market strategist.

Your job is to analyze real user demand and produce decisive, high-signal insights.

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
  "core_constraint": "",
  "pains": [],
  "objections": [],
  "market_gaps": [],
  "positioning_strategy": {
    "emphasize": [],
    "avoid": [],
    "competitor_blindspots": []
  },
  "recommended_move": "",
  "executive_summary": []
}

Rules:
- Be decisive. No hedging.
- No fluff. No generic advice.
- Frequency must reflect repetition across queries.
- Dominant narrative must be one sharp sentence.
- Executive summary must be 3–4 bullets max.
- Positioning must be strategic, not vague.
- Recommended move must be a clear directive.

Data:
SERP_DATA:
${JSON.stringify(serpData, null, 2)}

CLUSTERS:
${JSON.stringify(clusters.clusters, null, 2)}

CLASSIFICATION:
${JSON.stringify(classification, null, 2)}
`;

    const synthesisRes = await client.responses.create({
      model: synthesisModel,
      input: synthesisPrompt
    });

    const synthesisText = extractOutputText(synthesisRes);
    const synthesis = normalizeSynthesis(safeParse<MarketSynthesis>(synthesisText), clusters, classification);
    const confidence = deriveConfidence(synthesis.signal_strength);
    const strategy = deriveStrategy(synthesis);

    if (!synthesis.dominant_narrative && !synthesis.core_constraint && !synthesis.recommended_move) {
      throw new Error("Synthesis model returned invalid JSON.");
    }

    const response: MarketAnalysisResponse = {
      success: true,
      query: finalQuery,
      serpData,
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
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(response);
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

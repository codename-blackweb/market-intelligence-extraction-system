import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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
    query: finalQuery,
    marketType,
    depth,
    serpData
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
    const { openAiApiKey, analysisModel, synthesisModel } = getRuntimeConfig();
    const { query, marketType, depth, serpData: providedSerpData } = normalizePayload(
      await request.json()
    );
    const serpData = providedSerpData.length
      ? providedSerpData
      : await buildNormalizedSerpData(query);

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
      query,
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

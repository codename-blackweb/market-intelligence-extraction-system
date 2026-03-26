import OpenAI from "openai";
import { compactUnique } from "@/lib/utils";
import { buildNormalizedSerpData } from "@/lib/serpapi";
import type {
  MarketAnalysisResponse,
  MarketClusters,
  MarketClassification,
  MarketConfidence,
  MarketStrategy
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
  const marketType = typeof payload.marketType === "string" ? payload.marketType.trim() : "";
  const depthCandidate = typeof payload.depth === "string" ? payload.depth.trim() : "";
  const depth =
    depthCandidate === "deep" || depthCandidate === "aggressive" ? depthCandidate : "standard";

  if (!query) {
    throw new Error("Query is required.");
  }

  const serpData = compactUnique(
    Array.isArray(payload.serpData)
      ? payload.serpData.filter((item): item is string => typeof item === "string")
      : [],
    50
  );

  return {
    query,
    marketType,
    depth,
    serpData
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

export async function POST(request: Request) {
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

    const analysisRes = await client.responses.create({
      model: analysisModel,
      input: analysisPrompt
    });

    const classificationText = extractOutputText(analysisRes);
    const classification = safeParse<MarketClassification>(classificationText);

    if (!classification) {
      throw new Error("Analysis model returned invalid JSON.");
    }

    const clusteringPrompt = `
You are a market intelligence clustering system.

Group these real user search queries into demand clusters.

Return ONLY JSON in this format:
{
  "clusters": [
    {
      "theme": "",
      "queries": []
    }
  ]
}

Queries:
${JSON.stringify(serpData)}

Market Type:
${marketType || "unspecified"}

Analysis Depth:
${depth}

Rules:
- Group by actual thematic similarity
- Use concise theme names
- Keep the original query wording
- Put every query into the best-fit cluster
- No explanations
`;

    const confidencePrompt = `
You are a market intelligence validator.

Given this classification:
${JSON.stringify(classification, null, 2)}

And these queries:
${JSON.stringify(serpData)}

Market Type:
${marketType || "unspecified"}

Analysis Depth:
${depth}

Return ONLY JSON in this format:
{
  "confidence_score": "",
  "reason": ""
}

Rules:
- confidence_score should be one of: High, Medium, Low
- reason should be short, direct, and evidence-based
- No explanations outside JSON
`;

    const synthesisPrompt = `
You are a senior growth strategist.

Given this classification:
${JSON.stringify(classification, null, 2)}

And these queries:
${JSON.stringify(serpData)}

Market Type:
${marketType || "unspecified"}

Analysis Depth:
${depth}

Generate:

1. Core Growth Constraint
2. Top 3 Customer Pains
3. Hidden Objections
4. Recommended Acquisition Angle
5. Messaging Direction
6. Offer Positioning

Return clean JSON:
{
  "core_constraint": "",
  "pains": [],
  "objections": [],
  "acquisition_angle": "",
  "messaging": "",
  "offer_positioning": ""
}
`;

    const [clusteringRes, confidenceRes, synthesisRes] = await Promise.all([
      client.responses.create({
        model: analysisModel,
        input: clusteringPrompt
      }),
      client.responses.create({
        model: analysisModel,
        input: confidencePrompt
      }),
      client.responses.create({
        model: synthesisModel,
        input: synthesisPrompt
      })
    ]);

    const clusteringText = extractOutputText(clusteringRes);
    const clusters = safeParse<MarketClusters>(clusteringText);

    if (!clusters) {
      throw new Error("Clustering model returned invalid JSON.");
    }

    const confidenceText = extractOutputText(confidenceRes);
    const confidence = safeParse<MarketConfidence>(confidenceText);

    if (!confidence) {
      throw new Error("Confidence model returned invalid JSON.");
    }

    const synthesisText = extractOutputText(synthesisRes);
    const strategy = safeParse<MarketStrategy>(synthesisText);

    if (!strategy) {
      throw new Error("Synthesis model returned invalid JSON.");
    }

    const response: MarketAnalysisResponse = {
      success: true,
      query,
      serpData,
      clusters,
      confidence,
      classification,
      strategy,
      generatedAt: new Date().toISOString()
    };

    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze market data.";
    const status = message === "Query is required." || message === "serpData is required." ? 400 : 500;

    return Response.json(
      {
        success: false,
        error: message
      } satisfies MarketAnalysisResponse,
      { status }
    );
  }
}

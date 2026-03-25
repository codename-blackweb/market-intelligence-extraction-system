import OpenAI from "openai";
import { compactUnique } from "@/lib/utils";
import type {
  MarketAnalysisResponse,
  MarketClassification,
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

  if (!query) {
    throw new Error("Query is required.");
  }

  const serpData = compactUnique(
    Array.isArray(payload.serpData)
      ? payload.serpData.filter((item): item is string => typeof item === "string")
      : [],
    50
  );

  if (!serpData.length) {
    throw new Error("serpData is required.");
  }

  return {
    query,
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
    const { query, serpData } = normalizePayload(await request.json());

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

    const synthesisPrompt = `
You are a senior growth strategist.

Given this classification:
${JSON.stringify(classification, null, 2)}

And these queries:
${JSON.stringify(serpData)}

Generate:

1. Core Growth Constraint
2. Top 3 Customer Pains
3. Hidden Objections
4. Recommended Acquisition Angle
5. Messaging Direction

Return clean JSON:
{
  "core_constraint": "",
  "pains": [],
  "objections": [],
  "acquisition_angle": "",
  "messaging": ""
}
`;

    const synthesisRes = await client.responses.create({
      model: synthesisModel,
      input: synthesisPrompt
    });

    const synthesisText = extractOutputText(synthesisRes);
    const strategy = safeParse<MarketStrategy>(synthesisText);

    if (!strategy) {
      throw new Error("Synthesis model returned invalid JSON.");
    }

    const response: MarketAnalysisResponse = {
      success: true,
      query,
      serpData,
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

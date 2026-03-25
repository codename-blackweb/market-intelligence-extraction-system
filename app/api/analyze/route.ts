import { runPipeline } from "@/lib/pipeline";
import { compactUnique } from "@/lib/utils";
import type { AnalyzePayload, MarketType, ReviewInput, ReviewSource } from "@/types/intake";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function normalizeMarketType(value: unknown): MarketType {
  const candidate = typeof value === "string" ? value.toLowerCase() : "";

  if (
    candidate === "service" ||
    candidate === "saas" ||
    candidate === "ecommerce" ||
    candidate === "product" ||
    candidate === "other"
  ) {
    return candidate;
  }

  return "service";
}

function normalizeReviewSource(value: unknown): ReviewSource {
  const candidate = typeof value === "string" ? value.toLowerCase() : "";

  if (
    candidate === "trustpilot" ||
    candidate === "google" ||
    candidate === "amazon" ||
    candidate === "other"
  ) {
    return candidate;
  }

  return "other";
}

function normalizeReviews(value: unknown): ReviewInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const reviews: ReviewInput[] = [];

  for (const review of value) {
    if (!review || typeof review !== "object") {
      continue;
    }

    const item = review as Record<string, unknown>;
    const body = typeof item.body === "string" ? item.body.trim() : "";

    if (!body) {
      continue;
    }

    reviews.push({
      source: normalizeReviewSource(item.source),
      rating: Number(item.rating ?? 0),
      title: typeof item.title === "string" ? item.title : undefined,
      body
    });
  }

  return reviews;
}

function normalizePayload(body: unknown): AnalyzePayload {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;
  const seedQuery = typeof payload.seedQuery === "string" ? payload.seedQuery.trim() : "";

  if (!seedQuery) {
    throw new Error("Seed query is required.");
  }

  const asStringArray = (value: unknown) =>
    compactUnique(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

  return {
    seedQuery,
    competitors: asStringArray(payload.competitors),
    landingPageUrls: asStringArray(payload.landingPageUrls),
    subreddits: asStringArray(payload.subreddits),
    marketType: normalizeMarketType(payload.marketType),
    reviews: normalizeReviews(payload.reviews)
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
    analysisModel: analysisModel!,
    synthesisModel: synthesisModel!
  };
}

export async function POST(request: Request) {
  try {
    const { analysisModel, synthesisModel } = getRuntimeConfig();
    const payload = normalizePayload(await request.json());
    const report = await runPipeline(payload, {
      analysisModel,
      synthesisModel
    });
    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze market data.";
    const status = message === "Seed query is required." ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

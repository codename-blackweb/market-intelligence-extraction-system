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

export async function POST(request: Request) {
  try {
    const payload = normalizePayload(await request.json());
    const report = await runPipeline(payload);
    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze market data.";
    const status = message === "Seed query is required." ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

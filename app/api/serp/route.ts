import { buildNormalizedSerpData } from "@/lib/serpapi";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function getQuery(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const candidate = (body as { query?: unknown }).query;
  const query = typeof candidate === "string" ? candidate.trim() : "";

  if (!query) {
    throw new Error("Query is required.");
  }

  return query;
}

export async function POST(request: Request) {
  try {
    if (!process.env.SERPAPI_KEY) {
      throw new Error("Missing required environment variable: SERPAPI_KEY.");
    }

    const query = getQuery(await request.json());
    const serpData = await buildNormalizedSerpData(query);

    return Response.json({
      success: true,
      query,
      serpData
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch SERP data.";
    const status = message === "Query is required." ? 400 : 500;

    return Response.json(
      {
        success: false,
        error: message
      },
      { status }
    );
  }
}

import { compactUnique } from "@/lib/utils";

function getSerpApiKey() {
  const key = process.env.SERPAPI_KEY;

  if (!key) {
    throw new Error("Missing SERPAPI_KEY.");
  }

  return key;
}

async function fetchSerpApi(params: Record<string, string>) {
  const url = new URL("https://serpapi.com/search.json");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  url.searchParams.set("api_key", getSerpApiKey());

  const response = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${await response.text()}`);
  }

  return response.json();
}

export async function fetchAutocomplete(query: string) {
  return fetchSerpApi({
    engine: "google_autocomplete",
    q: query
  });
}

export async function fetchGoogleSearchIntel(query: string) {
  return fetchSerpApi({
    engine: "google",
    q: query,
    hl: "en",
    gl: "us",
    num: "10"
  });
}

export async function fetchCompetitorSearchIntel(competitor: string, seedQuery: string) {
  return fetchSerpApi({
    engine: "google",
    q: `${competitor} ${seedQuery}`,
    hl: "en",
    gl: "us",
    num: "6"
  });
}

export function normalizeAutocomplete(payload: unknown): string[] {
  const suggestions =
    (payload as { suggestions?: Array<{ value?: string }> })?.suggestions ?? [];

  return compactUnique(suggestions.map((item) => item.value));
}

export function normalizePeopleAlsoAsk(payload: unknown): string[] {
  const questions =
    (payload as { related_questions?: Array<{ question?: string }> })
      ?.related_questions ?? [];

  return compactUnique(questions.map((item) => item.question));
}

export function normalizeRelatedSearches(payload: unknown): string[] {
  const related =
    (payload as {
      related_searches?: Array<{ query?: string; text?: string }>;
    })?.related_searches ?? [];

  return compactUnique(related.map((item) => item.query ?? item.text));
}

export function normalizeOrganicSnippets(payload: unknown) {
  const results =
    (payload as {
      organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
    })?.organic_results ?? [];

  return results
    .map((item) => ({
      title: item.title?.trim() ?? "",
      snippet: item.snippet?.trim() ?? "",
      link: item.link?.trim() ?? ""
    }))
    .filter((item) => item.title || item.snippet)
    .slice(0, 8);
}

export function normalizeCompetitorBlocks(
  competitor: string,
  payload: unknown
): Array<{
  competitor: string;
  title: string;
  snippet: string;
  link: string;
}> {
  const organic =
    (payload as {
      organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
      ads?: Array<{ title?: string; description?: string; link?: string }>;
    }) ?? {};

  const organicBlocks = (organic.organic_results ?? []).map((item) => ({
    competitor,
    title: item.title?.trim() ?? "",
    snippet: item.snippet?.trim() ?? "",
    link: item.link?.trim() ?? ""
  }));

  const adBlocks = (organic.ads ?? []).map((item) => ({
    competitor,
    title: item.title?.trim() ?? "",
    snippet: item.description?.trim() ?? "",
    link: item.link?.trim() ?? ""
  }));

  return [...adBlocks, ...organicBlocks]
    .filter((item) => item.title || item.snippet)
    .slice(0, 6);
}

export async function buildNormalizedSerpData(query: string) {
  const [autocompleteRaw, searchRaw] = await Promise.all([
    fetchAutocomplete(query),
    fetchGoogleSearchIntel(query)
  ]);

  return compactUnique(
    [
      ...normalizeAutocomplete(autocompleteRaw),
      ...normalizePeopleAlsoAsk(searchRaw),
      ...normalizeRelatedSearches(searchRaw)
    ],
    50
  );
}

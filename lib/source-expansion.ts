import {
  fetchAmazonSearchIntel,
  fetchYouTubeSearchIntel
} from "@/lib/serpapi";
import { compactUnique, truncate } from "@/lib/utils";
import type { NormalizedSignal } from "@/types/market-analysis";

function buildWeightedSignals(
  texts: Array<string | null | undefined>,
  source: NormalizedSignal["source"],
  weight: number,
  limit = 8
) {
  return compactUnique(texts, limit).map((text) => ({
    text,
    source,
    weight
  })) satisfies NormalizedSignal[];
}

export async function collectYouTubeSignals(query: string) {
  try {
    const payload = (await fetchYouTubeSearchIntel(query)) as {
      video_results?: Array<{ title?: string }>;
      videos_results?: Array<{ title?: string }>;
    };

    const videos = payload.video_results ?? payload.videos_results ?? [];

    return buildWeightedSignals(
      videos.map((item) => item.title?.trim()),
      "YouTube",
      0.9,
      8
    );
  } catch {
    return [] as NormalizedSignal[];
  }
}

export async function collectAmazonSignals(query: string) {
  try {
    const payload = (await fetchAmazonSearchIntel(query)) as {
      organic_results?: Array<{
        title?: string;
        reviews?: number;
        rating?: number;
      }>;
      search_results?: Array<{
        title?: string;
        reviews?: number;
        rating?: number;
      }>;
    };

    const products = payload.organic_results ?? payload.search_results ?? [];

    return buildWeightedSignals(
      products.map((item) => {
        const title = item.title?.trim();

        if (!title) {
          return "";
        }

        if (typeof item.reviews === "number") {
          return `${title} — ${item.reviews} reviews`;
        }

        if (typeof item.rating === "number") {
          return `${title} — rated ${item.rating}`;
        }

        return title;
      }),
      "Amazon",
      0.95,
      6
    );
  } catch {
    return [] as NormalizedSignal[];
  }
}

export async function collectNewsSignals(query: string) {
  try {
    const url = new URL("https://news.google.com/rss/search");
    url.searchParams.set("q", query);
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("gl", "US");
    url.searchParams.set("ceid", "US:en");

    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error("News fetch failed");
    }

    const xml = await response.text();
    const titles = Array.from(xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g))
      .map((match) => match[1]?.trim())
      .filter(Boolean)
      .slice(1, 9);

    return buildWeightedSignals(titles, "News", 0.8, 8);
  } catch {
    return [] as NormalizedSignal[];
  }
}

export async function collectCompetitorSignals(urls: string[]) {
  const settled = await Promise.allSettled(
    urls.slice(0, 5).map(async (url) => {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Competitor fetch failed for ${url}`);
      }

      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
      const metaMatch = html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      );

      const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim() ?? "";
      const meta = metaMatch?.[1]?.replace(/\s+/g, " ").trim() ?? "";

      return truncate([title, meta].filter(Boolean).join(" — "), 220);
    })
  );

  return buildWeightedSignals(
    settled
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value),
    "Competitor",
    0.78,
    5
  );
}

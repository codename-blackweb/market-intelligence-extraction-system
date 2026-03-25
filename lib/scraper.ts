import * as cheerio from "cheerio";
import { truncate } from "@/lib/utils";

export async function fetchLandingPageText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
    },
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch landing page: ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, noscript, svg").remove();

  const text = truncate($("body").text().replace(/\s+/g, " ").trim(), 12000);

  return {
    url,
    title: $("title").first().text().trim(),
    h1s: $("h1")
      .map((_, element) => $(element).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 8),
    h2s: $("h2")
      .map((_, element) => $(element).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 12),
    buttons: $("button, a")
      .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 20),
    text
  };
}


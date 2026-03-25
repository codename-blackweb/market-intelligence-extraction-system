import type { ReviewInput, ReviewSource } from "@/types/intake";

function normalizeSource(value: string): ReviewSource {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "trustpilot" ||
    normalized === "google" ||
    normalized === "amazon" ||
    normalized === "other"
  ) {
    return normalized;
  }

  return "other";
}

function splitCsvRow(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const next = row[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): ReviewInput[] {
  const rows = content
    .split(/\r?\n/g)
    .map((row) => row.trim())
    .filter(Boolean);

  if (!rows.length) {
    return [];
  }

  const headers = splitCsvRow(rows[0]).map((header) => header.toLowerCase());
  const sourceIndex = headers.indexOf("source");
  const ratingIndex = headers.indexOf("rating");
  const titleIndex = headers.indexOf("title");
  const bodyIndex = headers.indexOf("body");

  if (ratingIndex === -1 || bodyIndex === -1) {
    throw new Error("CSV reviews must include at least 'rating' and 'body' columns.");
  }

  return rows.slice(1).map((row) => {
    const cells = splitCsvRow(row);
    return {
      source: normalizeSource(sourceIndex >= 0 ? cells[sourceIndex] ?? "other" : "other"),
      rating: Number(cells[ratingIndex] ?? 0),
      title: titleIndex >= 0 ? cells[titleIndex] : undefined,
      body: cells[bodyIndex] ?? ""
    };
  });
}

function parseJson(content: string): ReviewInput[] {
  const payload = JSON.parse(content) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("JSON reviews must be an array.");
  }

  return payload.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Each JSON review must be an object.");
    }

    const review = item as Record<string, unknown>;

    return {
      source: normalizeSource(typeof review.source === "string" ? review.source : "other"),
      rating: Number(review.rating ?? 0),
      title: typeof review.title === "string" ? review.title : undefined,
      body: typeof review.body === "string" ? review.body : ""
    };
  });
}

export function parseReviewsFile(fileName: string, content: string): ReviewInput[] {
  const reviews = fileName.toLowerCase().endsWith(".json")
    ? parseJson(content)
    : parseCsv(content);

  return reviews.filter((review) => Number.isFinite(review.rating) && review.body.trim());
}

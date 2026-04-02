import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function compactUnique(values: Array<string | null | undefined>, limit = 50): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();

    if (!normalized) {
      continue;
    }

    if (seen.has(normalized.toLowerCase())) {
      continue;
    }

    seen.add(normalized.toLowerCase());
    result.push(normalized);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

export function splitListInput(value: string): string[] {
  return compactUnique(value.split(/\r?\n|,/g));
}

export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.toString();
  } catch {
    return null;
  }
}

export function truncate(value: string, length = 4000): string {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1).trimEnd()}...`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
      msg?: unknown;
    };

    const parts = [
      candidate.message,
      candidate.error_description,
      candidate.details,
      candidate.hint,
      candidate.code
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    if (parts.length > 0) {
      return parts.join(" | ");
    }

    if (typeof candidate.msg === "string" && candidate.msg.trim().length > 0) {
      return candidate.msg.trim();
    }
  }

  return "An unexpected error occurred.";
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function maybeArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

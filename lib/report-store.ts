import type { MarketAnalysisReport } from "@/types/market-analysis";
import { safeJsonParse, slugify } from "@/lib/utils";

const STORAGE_PREFIX = "market-intel-report:";

export function createReportId(seedQuery: string) {
  return `${slugify(seedQuery) || "market-report"}-${Date.now().toString(36)}`;
}

export function saveReport(reportId: string, report: MarketAnalysisReport) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify(report));
}

export function loadReport(reportId: string): MarketAnalysisReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);

  if (!raw) {
    return null;
  }

  const parsed = safeJsonParse<Partial<MarketAnalysisReport>>(raw);

  if (!parsed || !parsed.query || !parsed.serpData || !parsed.classification || !parsed.strategy) {
    return null;
  }

  return {
    query: parsed.query,
    serpData: parsed.serpData,
    clusters: parsed.clusters ?? { clusters: [] },
    confidence: parsed.confidence ?? {
      confidence_score: "N/A",
      reason: "This report was generated before confidence scoring was added."
    },
    classification: parsed.classification,
    strategy: {
      ...parsed.strategy,
      offer_positioning: parsed.strategy.offer_positioning ?? ""
    },
    generatedAt: parsed.generatedAt ?? new Date().toISOString()
  };
}

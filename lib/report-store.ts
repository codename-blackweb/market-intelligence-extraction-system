import type { FinalReport } from "@/types/report";
import { safeJsonParse, slugify } from "@/lib/utils";

const STORAGE_PREFIX = "market-intel-report:";

export function createReportId(seedQuery: string) {
  return `${slugify(seedQuery) || "market-report"}-${Date.now().toString(36)}`;
}

export function saveReport(reportId: string, report: FinalReport) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify(report));
}

export function loadReport(reportId: string): FinalReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);

  if (!raw) {
    return null;
  }

  return safeJsonParse<FinalReport>(raw);
}


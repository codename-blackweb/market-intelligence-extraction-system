"use client";

import type { PendingAnalysisDraft } from "@/lib/types";
import type { UserPlan } from "@/types/market-analysis";

export const USER_ID_STORAGE_KEY = "market-intelligence:user-id:v1";
export const USER_PLAN_STORAGE_KEY = "market-intelligence:user-plan:v1";
export const PENDING_PLAN_STORAGE_KEY = "market-intelligence:pending-plan:v1";
export const PENDING_ANALYSIS_RESTORE_STORAGE_KEY =
  "market-intelligence:pending-analysis-restore:v1";
export const PENDING_ANALYSIS_DRAFT_STORAGE_KEY =
  "market-intelligence:pending-analysis-draft:v1";

export function getOrCreateUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const next = window.crypto?.randomUUID?.() ?? `user-${Date.now().toString(36)}`;
  window.localStorage.setItem(USER_ID_STORAGE_KEY, next);
  return next;
}

export function loadStoredPlan(): UserPlan {
  if (typeof window === "undefined") {
    return "free";
  }

  const storedPlan = window.localStorage.getItem(USER_PLAN_STORAGE_KEY);

  if (storedPlan === "pro" || storedPlan === "agency") {
    return storedPlan;
  }

  return "free";
}

export function persistStoredPlan(plan: UserPlan) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_PLAN_STORAGE_KEY, plan);
}

export function loadPendingPlan(): Exclude<UserPlan, "free"> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const pendingPlan = window.localStorage.getItem(PENDING_PLAN_STORAGE_KEY);

  if (pendingPlan === "pro") {
    return "pro";
  }

  if (pendingPlan === "agency") {
    return "agency";
  }

  return null;
}

export function persistPendingPlan(plan: Exclude<UserPlan, "free">) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PENDING_PLAN_STORAGE_KEY, plan);
}

export function clearPendingPlan() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
}

export function persistPendingAnalysisRestore(analysisId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_ANALYSIS_RESTORE_STORAGE_KEY, analysisId);
}

export function loadPendingAnalysisRestore() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(PENDING_ANALYSIS_RESTORE_STORAGE_KEY);
}

export function clearPendingAnalysisRestore() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_ANALYSIS_RESTORE_STORAGE_KEY);
}

function isPendingAnalysisDraft(value: unknown): value is PendingAnalysisDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.query === "string" &&
    typeof candidate.marketType === "string" &&
    typeof candidate.depth === "string" &&
    typeof candidate.competitorNames === "string" &&
    typeof candidate.competitorUrls === "string" &&
    typeof candidate.niche === "string"
  );
}

export function persistPendingAnalysisDraft(draft: PendingAnalysisDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_ANALYSIS_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadPendingAnalysisDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PENDING_ANALYSIS_DRAFT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isPendingAnalysisDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingAnalysisDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_ANALYSIS_DRAFT_STORAGE_KEY);
}

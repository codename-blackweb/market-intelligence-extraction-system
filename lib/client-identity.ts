"use client";

import type { UserPlan } from "@/types/market-analysis";

export const USER_ID_STORAGE_KEY = "market-intelligence:user-id:v1";
export const USER_PLAN_STORAGE_KEY = "market-intelligence:user-plan:v1";
export const PENDING_PLAN_STORAGE_KEY = "market-intelligence:pending-plan:v1";

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

export function loadPendingPlan(): UserPlan {
  if (typeof window === "undefined") {
    return "pro";
  }

  const pendingPlan = window.localStorage.getItem(PENDING_PLAN_STORAGE_KEY);

  if (pendingPlan === "agency") {
    return "agency";
  }

  return "pro";
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

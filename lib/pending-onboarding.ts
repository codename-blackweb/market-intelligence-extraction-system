"use client";

type PendingOnboardingPayload = {
  email: string;
  firstName: string;
  lastName: string;
  workspaceName: string;
  useCase: string;
  teamSize: string;
  industry: string;
  inviteEmails: string[];
  inviteRole: string;
};

const PENDING_ONBOARDING_STORAGE_KEY = "market-intelligence:pending-onboarding:v1";

export function persistPendingOnboarding(payload: PendingOnboardingPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
}

export function loadPendingOnboarding(): PendingOnboardingPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PENDING_ONBOARDING_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingOnboardingPayload;
  } catch {
    return null;
  }
}

export function clearPendingOnboarding() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_ONBOARDING_STORAGE_KEY);
}

export type { PendingOnboardingPayload };

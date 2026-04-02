import type {
  GateType,
  PlanUsageSummary,
  SubscriptionRecord,
  UserPlan
} from "@/types/market-analysis";
import { FREE_LIVE_DAILY_LIMIT } from "@/lib/plan-config";
import { countLiveAnalysesToday, getPersistedSubscription } from "@/lib/persistence";

const ACTIVE_PAID_STATUSES = new Set(["active", "trialing"]);

export function resolveEffectivePlan(subscription?: SubscriptionRecord | null): UserPlan {
  const status = subscription?.status?.toLowerCase() ?? "active";

  if (
    (subscription?.plan === "pro" || subscription?.plan === "agency") &&
    ACTIVE_PAID_STATUSES.has(status)
  ) {
    return subscription.plan;
  }

  return "free";
}

export function buildPlanUsageSummary(input: {
  plan: UserPlan;
  subscriptionStatus?: string;
  liveRunsToday?: number;
}): PlanUsageSummary {
  const liveRunsToday = Math.max(0, input.liveRunsToday ?? 0);
  const plan = input.plan;
  const liveRunsLimit = plan === "free" ? FREE_LIVE_DAILY_LIMIT : null;

  return {
    plan,
    subscription_status: input.subscriptionStatus ?? "active",
    live_runs_today: liveRunsToday,
    live_runs_limit: liveRunsLimit,
    live_runs_remaining:
      liveRunsLimit === null ? null : Math.max(0, liveRunsLimit - liveRunsToday),
    deep_synthesis_enabled: plan !== "free",
    generators_enabled: plan !== "free",
    export_enabled: plan !== "free",
    compare_enabled: plan !== "free",
    competitor_inputs_enabled: plan !== "free",
    source_evidence_enabled: plan !== "free",
    multi_workspace_enabled: plan === "agency",
    team_features_enabled: plan === "agency",
    white_label_enabled: plan === "agency"
  };
}

export async function getUserPlanUsage(userId: string, accessToken?: string) {
  const subscription = await getPersistedSubscription(userId, accessToken);
  const effectivePlan = resolveEffectivePlan(subscription);
  const liveRunsToday = await countLiveAnalysesToday(userId, accessToken);

  return {
    subscription,
    usage: buildPlanUsageSummary({
      plan: effectivePlan,
      subscriptionStatus: subscription?.status ?? "active",
      liveRunsToday
    })
  };
}

export function buildGateResponse(gateType: GateType, message: string) {
  return {
    success: false as const,
    gated: true as const,
    gate_type: gateType,
    message,
    error: message
  };
}

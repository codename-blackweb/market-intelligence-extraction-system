import WorkspaceOnboarding from "@/components/auth/WorkspaceOnboarding";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{
    email?: string | string[];
    plan?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const emailValue = resolvedSearchParams.email;
  const planValue = resolvedSearchParams.plan;
  const initialEmail = Array.isArray(emailValue) ? emailValue[0] ?? "" : emailValue ?? "";
  const initialPlanRaw = Array.isArray(planValue) ? planValue[0] ?? "" : planValue ?? "";
  const initialPlan =
    initialPlanRaw === "pro" || initialPlanRaw === "agency" ? initialPlanRaw : null;

  return <WorkspaceOnboarding initialEmail={initialEmail} initialPlan={initialPlan} />;
}

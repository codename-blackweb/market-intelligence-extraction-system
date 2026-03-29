import WorkspaceOnboarding from "@/components/auth/WorkspaceOnboarding";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{
    email?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const emailValue = resolvedSearchParams.email;
  const initialEmail = Array.isArray(emailValue) ? emailValue[0] ?? "" : emailValue ?? "";

  return (
    <WorkspaceOnboarding initialEmail={initialEmail} />
  );
}

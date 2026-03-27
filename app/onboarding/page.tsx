import { Suspense } from "react";
import WorkspaceOnboarding from "@/components/auth/WorkspaceOnboarding";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <WorkspaceOnboarding />
    </Suspense>
  );
}

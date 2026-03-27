import { Suspense } from "react";
import AuthAccessShell from "@/components/auth/AuthAccessShell";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950" />}>
      <AuthAccessShell />
    </Suspense>
  );
}

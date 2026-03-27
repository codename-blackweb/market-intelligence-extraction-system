"use client";

import Link from "next/link";
import { Lock, UserRound } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AccountEntryButton() {
  const { isAuthenticated, session } = useAuth();

  return (
    <Link
      className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 text-xs font-black uppercase tracking-[0.16em] text-black shadow-sm backdrop-blur-xl transition-colors hover:bg-white dark:border-white/12 dark:bg-zinc-950/90 dark:text-zinc-100 dark:hover:bg-zinc-900"
      href={isAuthenticated ? "/account" : "/auth"}
    >
      {isAuthenticated ? <UserRound className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      <span>{isAuthenticated ? session?.user.first_name || "Workspace" : "Login"}</span>
    </Link>
  );
}

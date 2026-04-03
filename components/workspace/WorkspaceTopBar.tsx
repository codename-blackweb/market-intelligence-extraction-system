"use client";

import Link from "next/link";
import { CreditCard, LogOut, Settings2, UserRound } from "lucide-react";
import UsageMeter from "@/components/workspace/UsageMeter";
import { formatPlanLabel } from "@/lib/workspace-ui";
import type { PlanUsageSummary, UserPlan } from "@/types/market-analysis";
import styles from "./workspace-ui.module.css";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function WorkspaceTopBar({
  workspaceName,
  displayName,
  email,
  plan,
  usage,
  onSignOut
}: {
  workspaceName: string;
  displayName: string;
  email: string;
  plan: UserPlan;
  usage?: PlanUsageSummary | null;
  onSignOut: () => void;
}) {
  return (
    <header className={styles.topBar}>
      <div className={styles.workspaceHeader}>
        <p className={styles.eyebrow}>IntentEngine Workspace</p>
        <div className={styles.workspaceRow}>
          <h1 className={styles.workspaceName}>{workspaceName}</h1>
          <span className={styles.planBadge}>{formatPlanLabel(plan)}</span>
        </div>
        <p className={styles.subtleCopy}>
          Account surface for recent intelligence runs, saved views, and staged analysis inputs.
        </p>
      </div>

      <div className={styles.toolbarRight}>
        <div className={styles.toolbarMeta}>
          <UsageMeter compact usage={usage} />

          <div className={styles.accountCard}>
            <div className={styles.avatar}>{getInitials(displayName || email || "IE")}</div>
            <div>
              <p className={styles.accountName}>{displayName}</p>
              <p className={styles.accountMeta}>{email}</p>
            </div>
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <Link className={styles.toolbarLink} href="/account">
            <UserRound size={16} />
            Account
          </Link>
          <Link className={styles.toolbarLink} href="/billing">
            <CreditCard size={16} />
            Billing
          </Link>
          <button className={styles.toolbarButton} onClick={onSignOut} type="button">
            <LogOut size={16} />
            Sign out
          </button>
          <Link className={styles.toolbarLink} href="/">
            <Settings2 size={16} />
            Engine
          </Link>
        </div>
      </div>
    </header>
  );
}

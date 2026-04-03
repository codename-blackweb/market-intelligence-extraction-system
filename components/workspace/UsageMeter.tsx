"use client";

import { calculateUsageSnapshot } from "@/lib/workspace-ui";
import { cn } from "@/lib/utils";
import type { PlanUsageSummary } from "@/types/market-analysis";
import styles from "./workspace-ui.module.css";

export default function UsageMeter({
  usage,
  compact = false
}: {
  usage?: PlanUsageSummary | null;
  compact?: boolean;
}) {
  const snapshot = calculateUsageSnapshot(usage);

  return (
    <section className={cn(styles.usageMeter, compact && styles.usageCompact)}>
      <p className={styles.usageHeading}>{snapshot.heading}</p>
      <p className={styles.usageDetail}>{snapshot.detail}</p>
      <div aria-hidden="true" className={styles.usageTrack}>
        <div className={styles.usageFill} style={{ width: `${snapshot.progress}%` }} />
      </div>
    </section>
  );
}

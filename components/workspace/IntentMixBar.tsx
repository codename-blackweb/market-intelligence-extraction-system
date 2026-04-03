"use client";

import { cn } from "@/lib/utils";
import type { IntentMixSegment } from "@/lib/types";
import styles from "./workspace-ui.module.css";

const toneClassNames = {
  aqua: styles.toneAqua,
  cyan: styles.toneCyan,
  amber: styles.toneAmber,
  emerald: styles.toneEmerald
} as const;

export default function IntentMixBar({
  mix,
  compact = false
}: {
  mix: IntentMixSegment[];
  compact?: boolean;
}) {
  if (!mix.length) {
    return null;
  }

  return (
    <div className={styles.intentBarShell}>
      <div aria-label="Intent mix" className={styles.intentTrack}>
        {mix.map((segment) => (
          <span
            aria-hidden="true"
            className={cn(styles.intentSegment, toneClassNames[segment.tone])}
            key={segment.label}
            style={{ width: `${segment.percentage}%` }}
            title={`${segment.label}: ${segment.percentage}%`}
          />
        ))}
      </div>

      <div className={cn(styles.intentLegend, compact && styles.intentLegendCompact)}>
        {mix.map((segment) => (
          <span className={styles.intentLegendItem} key={segment.label}>
            <span className={cn(styles.intentDot, toneClassNames[segment.tone])} />
            {segment.label} {segment.percentage}%
          </span>
        ))}
      </div>
    </div>
  );
}

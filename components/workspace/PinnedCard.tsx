"use client";

import Link from "next/link";
import { ArrowUpRight, Pin } from "lucide-react";
import IntentMixBar from "@/components/workspace/IntentMixBar";
import { formatRelativeTime, formatVisibilityLabel } from "@/lib/workspace-ui";
import type { AnalysisDisplayRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./workspace-ui.module.css";

export default function PinnedCard({ record }: { record: AnalysisDisplayRecord }) {
  return (
    <article className={styles.pinnedCard}>
      <div className={styles.pinnedGlow} />

      <div className={styles.pinnedMeta}>
        <span className={cn(styles.statusPill, record.isPublic ? styles.statusPublic : styles.statusPrivate)}>
          <Pin size={12} />
          {record.isPublic ? "Pinned from shared" : "Pinned from recent"}
        </span>
        <span className={styles.analysisTime}>
          {record.mode} • {formatVisibilityLabel(record.isPublic)} • {formatRelativeTime(record.createdAt)}
        </span>
      </div>

      <h3 className={styles.pinnedTitle}>{record.query}</h3>
      <p className={styles.pinnedNarrative}>{record.dominantNarrative}</p>

      <IntentMixBar compact mix={record.intentMix} />

      <div className={styles.pinnedStats}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Confidence</p>
          <p className={styles.metricValue}>{Math.round(record.confidenceScore)}%</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Signals</p>
          <p className={styles.metricValue}>{record.signalCount}</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Intent</p>
          <p className={styles.metricValue}>{record.intentStage}</p>
        </div>
      </div>

      <div className={styles.analysisActions}>
        <Link className={styles.analysisLink} href={`/analysis/${record.id}`}>
          <ArrowUpRight size={16} />
          Open pinned view
        </Link>
      </div>
    </article>
  );
}

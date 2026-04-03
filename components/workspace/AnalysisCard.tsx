"use client";

import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import IntentMixBar from "@/components/workspace/IntentMixBar";
import {
  formatAnalysisTime,
  formatDepthLabel,
  formatRelativeTime,
  formatVisibilityLabel
} from "@/lib/workspace-ui";
import type { AnalysisDisplayRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./workspace-ui.module.css";

export default function AnalysisCard({
  record,
  onResume
}: {
  record: AnalysisDisplayRecord;
  onResume: (analysisId: string) => void;
}) {
  return (
    <article className={styles.analysisCard}>
      <div className={styles.analysisMetaRow}>
        <div>
          <span className={cn(styles.statusPill, record.isPublic ? styles.statusPublic : styles.statusPrivate)}>
            {record.mode} • {formatVisibilityLabel(record.isPublic)}
          </span>
          <h3 className={styles.analysisTitle}>
            <Link className={styles.analysisTitleLink} href={`/analysis/${record.id}`}>
              {record.query}
            </Link>
          </h3>
        </div>
        <time className={styles.analysisTime} dateTime={record.createdAt} title={formatAnalysisTime(record.createdAt)}>
          {formatRelativeTime(record.createdAt)}
        </time>
      </div>

      <p className={styles.analysisCopy}>{record.dominantNarrative}</p>

      <IntentMixBar compact mix={record.intentMix} />

      {record.tags.length ? (
        <div className={styles.chipRow}>
          {record.tags.map((tag) => (
            <span className={styles.chip} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.analysisMetrics}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Confidence</p>
          <p className={styles.metricValue}>{Math.round(record.confidenceScore)}%</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Signals</p>
          <p className={styles.metricValue}>{record.signalCount}</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Depth</p>
          <p className={styles.metricValue}>{formatDepthLabel(record.depth)}</p>
        </div>
      </div>

      <div className={styles.analysisActions}>
        <button className={styles.secondaryAction} onClick={() => onResume(record.id)} type="button">
          <RefreshCw size={16} />
          Resume
        </button>
        <Link className={styles.analysisLink} href={`/analysis/${record.id}`}>
          <ArrowUpRight size={16} />
          Open analysis
        </Link>
      </div>
    </article>
  );
}

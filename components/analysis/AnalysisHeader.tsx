"use client";

import Link from "next/link";
import { ArrowLeft, Copy, History, Link2 } from "lucide-react";
import { formatAnalysisTime, formatRelativeTime } from "@/lib/workspace-ui";
import { cn } from "@/lib/utils";
import styles from "./analysis-ui.module.css";

export default function AnalysisHeader({
  query,
  tags,
  createdAt,
  mode,
  isPublic,
  copyLabel,
  onCopyLink,
  onResume
}: {
  query: string;
  tags: string[];
  createdAt: string;
  mode: string;
  isPublic: boolean;
  copyLabel: string;
  onCopyLink: () => void;
  onResume: () => void;
}) {
  return (
    <header className={styles.headerCard}>
      <div className={styles.headerTop}>
        <div className={styles.headerMeta}>
          <p className={styles.eyebrow}>Analysis Detail</p>
          <h1 className={styles.headerTitle}>{query}</h1>
          <div className={styles.statusRow}>
            <span className={cn(styles.statusPill, isPublic && styles.statusPublic)}>
              {mode} • {isPublic ? "Public link live" : "Private analysis"}
            </span>
            <span className={styles.statusPill} title={formatAnalysisTime(createdAt)}>
              {formatRelativeTime(createdAt)}
            </span>
          </div>
          <div className={styles.tagRow}>
            {tags.map((tag) => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <p className={styles.metaCopy}>
            Generated {formatAnalysisTime(createdAt)}. The sections below preserve the current
            report data model while rebuilding the surface into a tighter workspace-grade UI.
          </p>
        </div>

        <div className={styles.actionRow}>
          <Link className={styles.ghostButton} href="/workspace">
            <ArrowLeft size={16} />
            Workspace
          </Link>
          <button className={styles.actionButton} onClick={onResume} type="button">
            <History size={16} />
            Resume in engine
          </button>
          <button className={styles.actionLink} onClick={onCopyLink} type="button">
            {isPublic ? <Link2 size={16} /> : <Copy size={16} />}
            {copyLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

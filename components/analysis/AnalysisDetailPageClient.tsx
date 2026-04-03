"use client";

import { useEffect, useMemo, useState } from "react";
import AnalysisHeader from "@/components/analysis/AnalysisHeader";
import InsightSection from "@/components/analysis/InsightSection";
import PremiumInsightCard from "@/components/analysis/PremiumInsightCard";
import IntentMixBar from "@/components/workspace/IntentMixBar";
import { useAuth } from "@/components/providers/AuthProvider";
import { persistPendingAnalysisRestore } from "@/lib/client-identity";
import { buildAnalysisDisplayRecord } from "@/lib/workspace-ui";
import type { PersistedAnalysisRecord } from "@/types/market-analysis";
import styles from "./analysis-ui.module.css";

type AnalysisResponse = {
  success: boolean;
  error?: string;
  analysis?: PersistedAnalysisRecord;
};

async function fetchAnalysis(analysisId: string, accessToken?: string) {
  const privateResponse = accessToken
    ? await fetch(`/api/analyses/${analysisId}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    : null;

  if (privateResponse) {
    const privateJson = (await privateResponse.json()) as AnalysisResponse;
    if (privateResponse.ok && privateJson.success && privateJson.analysis) {
      return privateJson.analysis;
    }
  }

  const publicResponse = await fetch(`/api/analyses/${analysisId}?public=1`, {
    cache: "no-store"
  });
  const publicJson = (await publicResponse.json()) as AnalysisResponse;

  if (!publicResponse.ok || !publicJson.success || !publicJson.analysis) {
    throw new Error(publicJson.error || "Analysis not found.");
  }

  return publicJson.analysis;
}

export default function AnalysisDetailPageClient({ analysisId }: { analysisId: string }) {
  const { isReady, session } = useAuth();
  const [analysis, setAnalysis] = useState<PersistedAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy link");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        setLoading(true);
        setError("");
        const nextAnalysis = await fetchAnalysis(analysisId, session?.access_token);

        if (!mounted) {
          return;
        }

        setAnalysis(nextAnalysis);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Analysis not found.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [analysisId, isReady, session?.access_token]);

  const displayRecord = useMemo(
    () => (analysis ? buildAnalysisDisplayRecord(analysis) : null),
    [analysis]
  );

  if (!isReady || loading) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.stateCard}>Loading analysis detail...</div>
        </div>
      </main>
    );
  }

  if (!analysis || !displayRecord) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.stateCard}>
            <p className={styles.eyebrow}>Unavailable</p>
            <h1 className={styles.sectionTitle}>This analysis is not available.</h1>
            <p className={styles.stateCopy}>
              {error || "The record may be private, missing, or no longer accessible."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const report = analysis.result_json;
  const sourceMeta = report.source_meta;
  const premiumAcquisitionPreview = [report.strategy.acquisition_angle || "Acquisition direction pending."];
  const premiumMessagingPreview = [
    report.strategy.messaging || "Messaging direction pending.",
    report.strategy.offer_positioning || "Offer positioning pending."
  ].filter(Boolean);
  const premiumBlindspotPreview = report.positioning_strategy.competitor_blindspots.length
    ? report.positioning_strategy.competitor_blindspots
    : ["Blindspot mapping becomes available in deeper premium views."];

  const handleCopyLink = async () => {
    if (!displayRecord.isPublic) {
      setCopyLabel("Private only");
      return;
    }

    const url = `${window.location.origin}/analysis/${analysis.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyLabel("Link copied");
    } catch {
      setCopyLabel("Copy failed");
    }
  };

  const handleResume = () => {
    persistPendingAnalysisRestore(analysis.id);
    window.location.href = "/#recent-analyses";
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AnalysisHeader
          copyLabel={copyLabel}
          createdAt={analysis.created_at}
          isPublic={displayRecord.isPublic}
          mode={displayRecord.mode}
          onCopyLink={handleCopyLink}
          onResume={handleResume}
          query={displayRecord.query}
          tags={displayRecord.tags}
        />

        <div className={styles.layout}>
          <div className={styles.stack}>
            <InsightSection
              description="The short-form decision layer for a fast read across the current market pattern."
              eyebrow="Executive Summary"
              title="What matters most right now."
            >
              <ul className={styles.bulletList}>
                {(report.executive_summary.length ? report.executive_summary : [report.dominant_narrative]).map(
                  (item) => (
                    <li key={item}>{item}</li>
                  )
                )}
              </ul>
            </InsightSection>

            <InsightSection
              description="Clusters preserve the visible demand pockets feeding the synthesis layer."
              eyebrow="Demand Clusters"
              title="Where the signal volume is concentrating."
            >
              <div className={styles.clusterGrid}>
                {report.clusters.clusters.length ? (
                  report.clusters.clusters.map((cluster) => (
                    <article className={styles.clusterCard} key={cluster.theme}>
                      <p className={styles.metricLabel}>{cluster.frequency} signals</p>
                      <h3 className={styles.clusterTitle}>{cluster.theme}</h3>
                      <p className={styles.clusterCopy}>{cluster.queries.slice(0, 3).join(" • ")}</p>
                    </article>
                  ))
                ) : (
                  <article className={styles.clusterCard}>
                    <p className={styles.clusterCopy}>No cluster data was returned for this run.</p>
                  </article>
                )}
              </div>
            </InsightSection>

            <InsightSection
              description="These are the direct strategy-facing outputs from the current report model."
              eyebrow="Decision Layer"
              title="Recommended move and exposed whitespace."
            >
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Recommended move</p>
                <p className={styles.metricValue}>{report.recommended_move}</p>
              </div>

              <div className={styles.pillGrid}>
                <article className={styles.pillCard}>
                  <p className={styles.pillCardTitle}>Market gaps</p>
                  <ul className={styles.pillCardList}>
                    {report.market_gaps.length ? (
                      report.market_gaps.map((gap) => <li key={gap}>{gap}</li>)
                    ) : (
                      <li>No gap signals returned.</li>
                    )}
                  </ul>
                </article>

                <article className={styles.pillCard}>
                  <p className={styles.pillCardTitle}>Voice of market</p>
                  <ul className={styles.pillCardList}>
                    <li>{report.dominant_narrative}</li>
                  </ul>
                </article>
              </div>
            </InsightSection>

            <InsightSection
              description="Pain themes and hidden objections stay separated so friction and resistance are easier to act on."
              eyebrow="Buyer Friction"
              title="Pain points and objections."
            >
              <div className={styles.pillGrid}>
                <article className={styles.pillCard}>
                  <p className={styles.pillCardTitle}>Customer pains</p>
                  <ul className={styles.pillCardList}>
                    {report.strategy.pains.length ? (
                      report.strategy.pains.map((pain) => <li key={pain}>{pain}</li>)
                    ) : (
                      <li>No pain patterns returned.</li>
                    )}
                  </ul>
                </article>

                <article className={styles.pillCard}>
                  <p className={styles.pillCardTitle}>Hidden objections</p>
                  <ul className={styles.pillCardList}>
                    {report.strategy.objections.length ? (
                      report.strategy.objections.map((objection) => <li key={objection}>{objection}</li>)
                    ) : (
                      <li>No objection signals returned.</li>
                    )}
                  </ul>
                </article>
              </div>
            </InsightSection>

            <InsightSection
              description="The current classification schema is preserved, but presented as a sharp scan grid instead of a report document."
              eyebrow="Classification"
              title="Structured market attributes."
            >
              <div className={styles.classificationGrid}>
                {[
                  ["Type", report.classification.core_type],
                  ["Model", report.classification.business_model],
                  ["Customer", report.classification.customer_type],
                  ["Intent", report.classification.intent_stage],
                  ["Behavior", report.classification.purchase_behavior],
                  ["Channel", report.classification.acquisition_channel],
                  ["Complexity", report.classification.value_complexity],
                  ["Risk", report.classification.risk_level],
                  ["Maturity", report.classification.market_maturity],
                  ["Competition", report.classification.competitive_structure]
                ].map(([label, value]) => (
                  <article className={styles.classificationCard} key={label}>
                    <p className={styles.classificationLabel}>{label}</p>
                    <p className={styles.classificationValue}>{value}</p>
                  </article>
                ))}
              </div>
            </InsightSection>
          </div>

          <aside className={`${styles.stack} ${styles.sidebar}`}>
            <section className={styles.snapshotCard}>
              <p className={styles.eyebrow}>Signal Snapshot</p>
              <h2 className={styles.snapshotTitle}>Confidence, strength, and intent concentration.</h2>

              <div className={styles.metricGrid}>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Confidence</p>
                  <p className={styles.metricValue}>{Math.round(displayRecord.confidenceScore)}%</p>
                </article>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Strength</p>
                  <p className={styles.metricValue}>{report.signal_strength.strength}</p>
                </article>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Pattern</p>
                  <p className={styles.metricValue}>{report.signal_strength.pattern_consistency}</p>
                </article>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Reasoning</p>
                  <p className={styles.metricValue}>{report.reasoning_quality}</p>
                </article>
              </div>

              <IntentMixBar mix={displayRecord.intentMix} />

              <div className={styles.sourceRow}>
                <span className={styles.sourceChip}>Google {sourceMeta.google_signal_count}</span>
                <span className={styles.sourceChip}>Reddit {sourceMeta.reddit_signal_count}</span>
                <span className={styles.sourceChip}>YouTube {sourceMeta.youtube_signal_count}</span>
                <span className={styles.sourceChip}>Amazon {sourceMeta.amazon_signal_count}</span>
                <span className={styles.sourceChip}>News {sourceMeta.news_signal_count}</span>
                <span className={styles.sourceChip}>
                  Competitors {sourceMeta.competitor_signal_count}
                </span>
              </div>

              <p className={styles.note}>{report.confidence.reason}</p>
            </section>

            <PremiumInsightCard
              description="Visual-only premium lock. The underlying logic remains unchanged."
              preview={premiumAcquisitionPreview}
              title="Acquisition Angles"
            />
            <PremiumInsightCard
              description="Premium messaging surfaces are intentionally shown as locked previews only."
              preview={premiumMessagingPreview}
              title="Messaging Direction"
            />
            <PremiumInsightCard
              description="Competitive blindspots remain visually gated here."
              preview={premiumBlindspotPreview}
              title="Positioning Blindspots"
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

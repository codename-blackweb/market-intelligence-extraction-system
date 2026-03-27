"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExportPdfButton from "@/components/report/ExportPdfButton";
import ReportView from "@/components/report/ReportView";
import type { MarketAnalysisReport, PersistedAnalysisRecord } from "@/types/market-analysis";

function toReport(record: PersistedAnalysisRecord): MarketAnalysisReport {
  return {
    ...record.result_json
  };
}

export default function SharedAnalysisPageClient({ analysisId }: { analysisId: string }) {
  const [analysis, setAnalysis] = useState<PersistedAnalysisRecord | null>(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      try {
        const response = await fetch(`/api/analyses/${analysisId}?public=1`, {
          cache: "no-store"
        });
        const json = (await response.json()) as {
          success: boolean;
          error?: string;
          analysis?: PersistedAnalysisRecord;
        };

        if (!response.ok || !json.success || !json.analysis) {
          throw new Error(json.error || "Analysis not found.");
        }

        if (isMounted) {
          setAnalysis(json.analysis);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Analysis not found.";
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  if (!isReady) {
    return (
      <main className="empty-state">
        <p className="eyebrow">Loading</p>
        <h1>Loading shared intelligence...</h1>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="empty-state stack">
        <p className="eyebrow">Unavailable</p>
        <h1>This intelligence report is not available.</h1>
        <p>{error || "The link may be private or no longer exists."}</p>
        <div className="button-row">
          <Link className="primary-button" href="/">
            Back to engine
          </Link>
        </div>
      </main>
    );
  }

  const report = toReport(analysis);

  return (
    <main className="report-page">
      <div className="toolbar-panel no-print">
        <div>
          <p className="toolbar-title">Market Intelligence Engine</p>
          <p className="toolbar-subtitle">Shared intelligence report</p>
        </div>

        <div className="toolbar-actions">
          <Link className="ghost-button" href="/">
            Open app
          </Link>
          <ExportPdfButton
            fileName={`${analysis.query.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-shared-report.pdf`}
            targetRef={reportRef}
          />
        </div>
      </div>

      <div id="shared-report" ref={reportRef}>
        <ReportView report={report} />
      </div>
    </main>
  );
}

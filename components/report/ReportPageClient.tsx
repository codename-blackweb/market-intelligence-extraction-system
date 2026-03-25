"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExportPdfButton from "@/components/report/ExportPdfButton";
import PrintButton from "@/components/report/PrintButton";
import ReportView from "@/components/report/ReportView";
import { loadReport } from "@/lib/report-store";
import { slugify } from "@/lib/utils";
import type { MarketAnalysisReport } from "@/types/market-analysis";

export default function ReportPageClient({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<MarketAnalysisReport | null>(null);
  const [isReady, setIsReady] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReport(loadReport(reportId));
    setIsReady(true);
  }, [reportId]);

  const fileName = `${slugify(report?.query || "market-analysis")}-report.pdf`;

  if (!isReady) {
    return (
      <main className="empty-state">
        <p className="eyebrow">Loading</p>
        <h1>Loading report...</h1>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="empty-state stack">
        <p className="eyebrow">Report Missing</p>
        <h1>This report is not available in local storage.</h1>
        <p>
          The current MVP stores generated reports in the browser. Run a new analysis from the
          intake screen to recreate it.
        </p>
        <div className="button-row">
          <Link className="primary-button" href="/">
            Back to intake
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="report-page">
      <div className="toolbar-panel no-print">
        <div>
          <p className="toolbar-title">Market Intelligence Engine</p>
          <p className="toolbar-subtitle">Classification, strategy, and PDF export</p>
        </div>

        <div className="toolbar-actions">
          <Link className="ghost-button" href="/">
            New run
          </Link>
          <PrintButton />
          <ExportPdfButton fileName={fileName} targetRef={reportRef} />
        </div>
      </div>

      <div id="report" ref={reportRef}>
        <ReportView report={report} />
      </div>
    </main>
  );
}

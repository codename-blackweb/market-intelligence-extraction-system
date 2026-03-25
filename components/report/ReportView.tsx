import CompetitorAnglesSection from "@/components/report/CompetitorAnglesSection";
import GapsSection from "@/components/report/GapsSection";
import KeywordsSection from "@/components/report/KeywordsSection";
import LanguageSection from "@/components/report/LanguageSection";
import OverviewPanel from "@/components/report/OverviewPanel";
import ProblemsSection from "@/components/report/ProblemsSection";
import ReportShell from "@/components/report/ReportShell";
import ReportSidebar from "@/components/report/ReportSidebar";
import StrategySection from "@/components/report/StrategySection";
import type { FinalReport } from "@/types/report";

export default function ReportView({ report }: { report: FinalReport }) {
  const subtitle = [
    report.seed_query ? `Seed query: ${report.seed_query}` : null,
    report.generated_at
      ? `Generated ${new Date(report.generated_at).toLocaleString()}`
      : null,
    report.market_type ? `Market type: ${report.market_type}` : null
  ]
    .filter(Boolean)
    .join("  •  ");

  return (
    <ReportShell title={report.title || "Market Intelligence Report"} subtitle={subtitle}>
      <div className="report-grid">
        <ReportSidebar />

        <div className="report-main">
          <OverviewPanel report={report} />
          <ProblemsSection report={report} />
          <LanguageSection report={report} />
          <KeywordsSection report={report} />
          <CompetitorAnglesSection report={report} />
          <GapsSection report={report} />
          <StrategySection report={report} />
        </div>
      </div>
    </ReportShell>
  );
}


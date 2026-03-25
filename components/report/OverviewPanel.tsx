import InsightCallout from "@/components/report/InsightCallout";
import SectionCard from "@/components/report/SectionCard";
import type { FinalReport } from "@/types/report";

export default function OverviewPanel({ report }: { report: FinalReport }) {
  const topProblem = report.section_1_problems[0];
  const topDirection = report.strategic_direction[0];
  const warnings = report.meta?.warnings ?? [];

  return (
    <SectionCard
      id="overview"
      title="Overview"
      description="A high-level read on the report density, strongest signals, and any collection gaps."
    >
      <div className="stack-xl">
        <div className="metrics-grid">
          <article className="metric-card">
            <p className="metric-label">Problems</p>
            <p className="metric-value">{report.section_1_problems.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Keyword Clusters</p>
            <p className="metric-value">{report.section_3_keywords.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Competitor Angles</p>
            <p className="metric-value">{report.section_4_competitor_angles.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Strategic Gaps</p>
            <p className="metric-value">{report.section_5_gaps.length}</p>
          </article>
        </div>

        {topProblem ? (
          <InsightCallout title={`Primary problem cluster: ${topProblem.problem_name}`}>
            {topProblem.description || topProblem.evidence[0] || "This cluster carried the strongest signal."}
          </InsightCallout>
        ) : null}

        {topDirection ? (
          <InsightCallout title="First strategic move">{topDirection}</InsightCallout>
        ) : null}

        {warnings.length ? (
          <div className="info-banner">
            <p className="aside-label">Collection warnings</p>
            <ul className="warning-list">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}


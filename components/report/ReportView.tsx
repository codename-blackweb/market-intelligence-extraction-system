import ReportShell from "@/components/report/ReportShell";
import ReportSidebar from "@/components/report/ReportSidebar";
import SectionCard from "@/components/report/SectionCard";
import type { MarketAnalysisReport } from "@/types/market-analysis";

const sidebarItems = [
  { id: "source-activity", label: "Source Activity" },
  { id: "executive-summary", label: "Executive Summary" },
  { id: "dominant-narrative", label: "Dominant Narrative" },
  { id: "signal-strength", label: "Signal Strength" },
  { id: "confidence", label: "Confidence" },
  { id: "clusters", label: "Demand Clusters" },
  { id: "market-gaps", label: "Market Gaps" },
  { id: "recommended-move", label: "Recommended Move" },
  { id: "breakdown", label: "Market Breakdown" },
  { id: "constraint", label: "Core Constraint" },
  { id: "pains", label: "Customer Pains" },
  { id: "objections", label: "Hidden Objections" },
  { id: "acquisition", label: "Acquisition Angle" },
  { id: "offer-positioning", label: "Offer Positioning" },
  { id: "messaging", label: "Messaging Direction" },
  { id: "signals", label: "Source Queries" }
];

const classificationRows = [
  ["Type", "core_type"],
  ["Model", "business_model"],
  ["Customer", "customer_type"],
  ["Intent", "intent_stage"],
  ["Purchase Behavior", "purchase_behavior"],
  ["Acquisition Channel", "acquisition_channel"],
  ["Value Complexity", "value_complexity"],
  ["Risk Level", "risk_level"],
  ["Market Maturity", "market_maturity"],
  ["Competitive Structure", "competitive_structure"]
] as const;

function formatEvidence(report: MarketAnalysisReport) {
  return `Derived from ${report.source_meta.google_signal_count} Google signals and ${report.source_meta.reddit_signal_count} Reddit threads.`;
}

function buildSourceMap(report: MarketAnalysisReport) {
  const sourceMap = new Map<string, string[]>();

  for (const signal of report.signal_origins) {
    sourceMap.set(signal.text.toLowerCase(), signal.sources);
  }

  return sourceMap;
}

export default function ReportView({ report }: { report: MarketAnalysisReport }) {
  const sourceMap = buildSourceMap(report);
  const subtitle = [
    `Query: ${report.query}`,
    `Generated ${new Date(report.generatedAt).toLocaleString()}`,
    `${report.serpData.length} source queries`
  ].join("  •  ");

  return (
    <ReportShell title="Market Analysis Report" subtitle={subtitle}>
      <div className="report-grid">
        <ReportSidebar items={sidebarItems} />

        <div className="report-main">
          <SectionCard
            id="source-activity"
            title="Source Activity"
            description="A traceability layer showing which sources contributed to the current report."
          >
            <div className="source-activity-strip" aria-label="Source activity">
              <span
                className={`source-activity-item ${report.source_meta.used_google ? "is-active" : "is-inactive"}`}
              >
                Google <span aria-hidden="true">{report.source_meta.used_google ? "●" : "○"}</span>
              </span>
              <span
                className={`source-activity-item ${report.source_meta.used_reddit ? "is-active" : "is-inactive"}`}
              >
                Reddit <span aria-hidden="true">{report.source_meta.used_reddit ? "●" : "○"}</span>
              </span>
              <span
                className={`source-activity-item ${report.source_meta.used_openai ? "is-active" : "is-inactive"}`}
              >
                OpenAI <span aria-hidden="true">{report.source_meta.used_openai ? "●" : "○"}</span>
              </span>
              <span
                className={`source-activity-item ${report.source_meta.used_youtube ? "is-active" : "is-inactive"}`}
              >
                YouTube <span aria-hidden="true">{report.source_meta.used_youtube ? "●" : "○"}</span>
              </span>
              <span
                className={`source-activity-item ${report.source_meta.used_amazon ? "is-active" : "is-inactive"}`}
              >
                Amazon <span aria-hidden="true">{report.source_meta.used_amazon ? "●" : "○"}</span>
              </span>
              <span
                className={`source-activity-item ${report.source_meta.used_news ? "is-active" : "is-inactive"}`}
              >
                News <span aria-hidden="true">{report.source_meta.used_news ? "●" : "○"}</span>
              </span>
              <span
                className={`source-activity-item ${report.source_meta.used_competitors ? "is-active" : "is-inactive"}`}
              >
                Competitors <span aria-hidden="true">{report.source_meta.used_competitors ? "●" : "○"}</span>
              </span>
            </div>
            {report.fallback_used ? <p className="section-description">Fallback synthesis used.</p> : null}
          </SectionCard>

          <SectionCard
            id="executive-summary"
            title="Executive Summary"
            description="The short-form decision layer for stakeholder sharing."
          >
            <ul className="bullet-list">
              {report.executive_summary.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            id="dominant-narrative"
            title="Dominant Narrative"
            description="The clearest read on the market pattern driving the rest of the analysis."
          >
            <div className="message-item">
              <p>{report.dominant_narrative}</p>
            </div>
            <p className="section-description">{formatEvidence(report)}</p>
          </SectionCard>

          <SectionCard
            id="signal-strength"
            title="Signal Strength"
            description="A compact reading of concentration, confidence, and pattern consistency."
          >
            <div className="signal-strength-meter" aria-hidden="true">
              <span
                className="signal-strength-meter-bar"
                style={{ width: `${Math.max(0, Math.min(100, report.signal_strength.confidence_score))}%` }}
              />
            </div>
            <div className="three-column-grid">
              <article className="metric-card">
                <p className="metric-label">Strength</p>
                <p className="report-subtitle">{report.signal_strength.strength}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Confidence</p>
                <p className="report-subtitle">{report.signal_strength.confidence_score}%</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Pattern</p>
                <p className="report-subtitle">{report.signal_strength.pattern_consistency}</p>
              </article>
            </div>
            <p className="section-description">{report.confidence.reason}</p>
            <p className="section-description">
              AI synthesis confidence {report.ai_confidence_score}% • Depth {report.synthesis_depth} • Reasoning{" "}
              {report.reasoning_quality}
            </p>
            <p className="section-description">{formatEvidence(report)}</p>
          </SectionCard>

          <SectionCard
            id="confidence"
            title="Confidence Score"
            description="A validation layer showing how strong the inferred market read is from the query set."
          >
            <div className="two-column-grid">
              <article className="metric-card">
                <p className="metric-label">Score</p>
                <p className="metric-value">{report.confidence.confidence_score || "N/A"}</p>
              </article>
              <article className="list-card">
                <h3>Reason</h3>
                <p>{report.confidence.reason || "No reason returned."}</p>
              </article>
            </div>
          </SectionCard>

          <SectionCard
            id="clusters"
            title="Demand Clusters"
            description="The visible patterns in the normalized demand set before strategy synthesis."
          >
            <div className="stack">
              {report.clusters.clusters.length ? (
                report.clusters.clusters.map((cluster) => (
                  <article className="list-card" key={cluster.theme}>
                    <h3>
                      {cluster.theme} — {cluster.frequency} signals
                    </h3>
                    <ul className="bullet-list signal-list">
                      {cluster.queries.map((item) => (
                        <li className="signal-list-item" key={item}>
                          <span>{item}</span>
                          <span className="signal-tag-row">
                            {(sourceMap.get(item.toLowerCase()) ?? []).map((source) => (
                              <span className="signal-origin-tag" key={`${item}-${source}`}>
                                {source}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
              ) : (
                <div className="info-banner">No demand clusters were returned.</div>
              )}
            </div>
            <p className="section-description">{formatEvidence(report)}</p>
          </SectionCard>

          <SectionCard
            id="market-gaps"
            title="Market Gaps"
            description="The whitespace exposed by the visible signal pattern."
          >
            <ul className="bullet-list">
              {report.market_gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
            <p className="section-description">{formatEvidence(report)}</p>
          </SectionCard>

          <SectionCard
            id="recommended-move"
            title="Recommended Move"
            description="The decision output the system thinks should shape the next move."
          >
            <div className="message-item">
              <p>{report.recommended_move}</p>
            </div>
            <p className="section-description">{formatEvidence(report)}</p>
          </SectionCard>

          <SectionCard
            id="breakdown"
            title="Market Breakdown"
            description="Classification output from the first analysis pass."
          >
            <div className="two-column-grid">
              {classificationRows.map(([label, key]) => (
                <article className="metric-card" key={key}>
                  <p className="metric-label">{label}</p>
                  <p className="report-subtitle">{report.classification[key]}</p>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            id="constraint"
            title="Core Constraint"
            description="The primary growth bottleneck inferred from the classified query set."
          >
            <div className="message-item">
              <p>{report.strategy.core_constraint}</p>
            </div>
          </SectionCard>

          <SectionCard
            id="pains"
            title="Customer Pains"
            description="The top pain themes exposed by the normalized search demand."
          >
            <ul className="bullet-list">
              {report.strategy.pains.map((pain) => (
                <li key={pain}>{pain}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            id="objections"
            title="Hidden Objections"
            description="The friction points and skepticism implied by the query patterns."
          >
            <ul className="bullet-list">
              {report.strategy.objections.map((objection) => (
                <li key={objection}>{objection}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            id="acquisition"
            title="Acquisition Angle"
            description="The acquisition direction recommended by the synthesis pass."
          >
            <div className="message-item">
              <p>{report.strategy.acquisition_angle}</p>
            </div>
          </SectionCard>

          <SectionCard
            id="offer-positioning"
            title="Offer Positioning"
            description="How the offer should be framed against the market dynamics and demand pattern."
          >
            <div className="message-item">
              <p>{report.strategy.offer_positioning || "No offer positioning returned."}</p>
            </div>
          </SectionCard>

          <SectionCard
            id="messaging"
            title="Messaging Direction"
            description="The message the model thinks should lead the market narrative."
          >
            <div className="message-item">
              <p>{report.strategy.messaging}</p>
            </div>
          </SectionCard>

          <SectionCard
            id="signals"
            title="Source Queries"
            description="The flat query array passed into classification and synthesis."
          >
            <ul className="bullet-list signal-list">
              {report.serpData.map((signal) => (
                <li className="signal-list-item" key={signal}>
                  <span>{signal}</span>
                  <span className="signal-tag-row">
                    {(sourceMap.get(signal.toLowerCase()) ?? []).map((source) => (
                      <span className="signal-origin-tag" key={`${signal}-${source}`}>
                        {source}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </ReportShell>
  );
}

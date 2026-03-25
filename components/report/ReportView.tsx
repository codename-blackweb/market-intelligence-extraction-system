import ReportShell from "@/components/report/ReportShell";
import ReportSidebar from "@/components/report/ReportSidebar";
import SectionCard from "@/components/report/SectionCard";
import type { MarketAnalysisReport } from "@/types/market-analysis";

const sidebarItems = [
  { id: "confidence", label: "Confidence" },
  { id: "clusters", label: "Demand Clusters" },
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

export default function ReportView({ report }: { report: MarketAnalysisReport }) {
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
                    <h3>{cluster.theme}</h3>
                    <ul className="bullet-list">
                      {cluster.queries.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))
              ) : (
                <div className="info-banner">No demand clusters were returned.</div>
              )}
            </div>
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
            <div className="keyword-cluster">
              {report.serpData.map((signal) => (
                <span className="keyword-chip" key={signal}>
                  {signal}
                </span>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </ReportShell>
  );
}

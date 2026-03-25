import CopyButton from "@/components/report/CopyButton";
import InsightCallout from "@/components/report/InsightCallout";
import SectionCard from "@/components/report/SectionCard";
import type { FinalReport } from "@/types/report";

export default function StrategySection({ report }: { report: FinalReport }) {
  const topMessage = report.recommended_messaging[0];

  return (
    <SectionCard
      id="strategy"
      title="Strategy"
      description="Messaging angles, funnel moves, and the prioritized strategic direction to act on."
    >
      <div className="stack-xl">
        {topMessage ? (
          <InsightCallout title="Lead with this angle">{topMessage}</InsightCallout>
        ) : null}

        <div className="two-column-grid">
          <article className="list-card">
            <h3>Recommended Messaging</h3>
            <div className="stack">
              {report.recommended_messaging.map((message) => (
                <div className="message-item" key={message}>
                  <div className="section-toolbar">
                    <h4>Messaging angle</h4>
                    <CopyButton text={message} />
                  </div>
                  <p>{message}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="list-card">
            <h3>Recommended Funnel Angles</h3>
            <div className="stack">
              {report.recommended_funnel_angles.length ? (
                report.recommended_funnel_angles.map((angle) => (
                  <div className="funnel-item" key={angle}>
                    {angle}
                  </div>
                ))
              ) : (
                <div className="info-banner">No funnel angles were returned.</div>
              )}
            </div>
          </article>
        </div>

        <article className="list-card">
          <h3>Strategic Direction</h3>
          <div className="stack">
            {report.strategic_direction.map((item) => (
              <div className="direction-item" key={item}>
                {item}
              </div>
            ))}
          </div>
        </article>
      </div>
    </SectionCard>
  );
}


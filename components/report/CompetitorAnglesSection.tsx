import type { FinalReport } from "@/types/report";
import SectionCard from "@/components/report/SectionCard";

export default function CompetitorAnglesSection({ report }: { report: FinalReport }) {
  return (
    <SectionCard
      id="angles"
      title="Competitor Angles"
      description="The dominant positioning patterns and proof themes competitors are leaning on."
    >
      <div className="stack">
        {report.section_4_competitor_angles.length ? (
          report.section_4_competitor_angles.map((angle) => (
            <article className="angle-card" key={angle.angle_name}>
              <h3>{angle.angle_name}</h3>
              <p>{angle.description}</p>
              <ul className="evidence-list">
                {angle.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <div className="info-banner">
            No competitor angle data was generated. Add competitor brands or URLs for this layer.
          </div>
        )}
      </div>
    </SectionCard>
  );
}


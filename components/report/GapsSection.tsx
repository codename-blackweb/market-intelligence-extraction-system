import type { FinalReport } from "@/types/report";
import SectionCard from "@/components/report/SectionCard";

export default function GapsSection({ report }: { report: FinalReport }) {
  return (
    <SectionCard
      id="gaps"
      title="Gaps"
      description="Whitespace, weak competitor patterns, and under-served objections surfaced by the data."
    >
      <div className="stack">
        {report.section_5_gaps.length ? (
          report.section_5_gaps.map((gap) => (
            <div className="gap-item" key={gap}>
              {gap}
            </div>
          ))
        ) : (
          <div className="info-banner">No clear strategic gaps were detected from the available inputs.</div>
        )}
      </div>
    </SectionCard>
  );
}


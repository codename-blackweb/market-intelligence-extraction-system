import SectionCard from "@/components/report/SectionCard";
import type { FinalReport } from "@/types/report";

export default function ProblemsSection({ report }: { report: FinalReport }) {
  return (
    <SectionCard
      id="problems"
      title="Problems"
      description="Demand themes and friction clusters backed by evidence from search, conversation, and reviews."
    >
      <div className="stack">
        {report.section_1_problems.map((problem) => (
          <article className="problem-card" key={problem.problem_name}>
            <h3>{problem.problem_name}</h3>
            {problem.description ? <p>{problem.description}</p> : null}
            <ul className="evidence-list">
              {problem.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}


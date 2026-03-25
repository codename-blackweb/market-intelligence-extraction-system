import CopyButton from "@/components/report/CopyButton";
import SectionCard from "@/components/report/SectionCard";
import type { FinalReport } from "@/types/report";

function getSignal(intent: string) {
  const normalized = intent.toLowerCase();

  if (normalized.includes("high") || normalized.includes("transaction")) {
    return "high";
  }

  if (normalized.includes("mid") || normalized.includes("consideration")) {
    return "medium";
  }

  return "low";
}

export default function KeywordsSection({ report }: { report: FinalReport }) {
  return (
    <SectionCard
      id="keywords"
      title="Keywords"
      description="Problem clusters, intent weighting, and recommended deployment paths."
    >
      <div className="stack-xl">
        <div className="table-shell">
          <table className="keyword-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Keywords</th>
                <th>Intent</th>
                <th>Recommended Use</th>
              </tr>
            </thead>
            <tbody>
              {report.section_3_keywords.map((cluster) => {
                const signal = getSignal(cluster.intent);
                return (
                  <tr key={`${cluster.problem_name}-${cluster.intent}`}>
                    <td>{cluster.problem_name}</td>
                    <td>
                      <div className="keyword-cluster">
                        {cluster.keywords.map((keyword) => (
                          <span className="keyword-chip" key={keyword}>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`signal-badge signal-${signal}`}>{cluster.intent}</span>
                    </td>
                    <td>{cluster.recommended_use}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="two-column-grid">
          {report.recommended_keywords.map((keyword) => (
            <article className="recommended-keyword-card" key={keyword.keyword}>
              <div className="section-toolbar">
                <h4>{keyword.keyword}</h4>
                <CopyButton text={keyword.keyword} />
              </div>
              <p>{keyword.why_it_matters}</p>
              <p>
                <strong>Use:</strong> {keyword.recommended_use}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}


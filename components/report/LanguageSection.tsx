import type { FinalReport } from "@/types/report";
import SectionCard from "@/components/report/SectionCard";

function ListCard({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <article className="list-card">
      <h3>{title}</h3>
      {items.length ? (
        <ul className="quote-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No language captured in this bucket.</p>
      )}
    </article>
  );
}

export default function LanguageSection({ report }: { report: FinalReport }) {
  return (
    <SectionCard
      id="language"
      title="Language"
      description="Verbatim market language, emotional pressure, and objection phrasing worth preserving."
    >
      <div className="three-column-grid">
        <ListCard title="Emotional Phrases" items={report.section_2_language.emotional_phrases} />
        <ListCard title="High-Value Quotes" items={report.section_2_language.high_value_quotes} />
        <ListCard title="Objection Language" items={report.section_2_language.objection_language} />
      </div>
    </SectionCard>
  );
}


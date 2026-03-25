import type { ReactNode } from "react";

export default function InsightCallout({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="insight-callout">
      <p className="eyebrow">Insight</p>
      <p className="insight-title">{title}</p>
      <div className="report-subtitle">{children}</div>
    </div>
  );
}


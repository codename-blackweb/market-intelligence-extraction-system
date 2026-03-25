import type { ReactNode } from "react";

export default function ReportShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="report-shell">
      <header className="cover-card">
        <p className="eyebrow">Market Intelligence Report</p>
        <h1>{title}</h1>
        {subtitle ? <p className="report-subtitle">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}


const items = [
  { id: "overview", label: "Overview" },
  { id: "problems", label: "Problems" },
  { id: "language", label: "Language" },
  { id: "keywords", label: "Keywords" },
  { id: "angles", label: "Competitor Angles" },
  { id: "gaps", label: "Gaps" },
  { id: "strategy", label: "Strategy" }
];

export default function ReportSidebar() {
  return (
    <aside className="report-sidebar">
      <p className="aside-label">Sections</p>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <a className="sidebar-link" href={`#${item.id}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}


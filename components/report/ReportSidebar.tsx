export default function ReportSidebar({
  items
}: {
  items: Array<{ id: string; label: string }>;
}) {
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

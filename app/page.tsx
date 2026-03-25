import IntakeForm from "@/components/intake/IntakeForm";

const modules = [
  "Search intelligence",
  "Reddit voice-of-customer",
  "Competitor messaging",
  "Landing page teardown",
  "Review synthesis",
  "Strategic report"
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Market Intelligence Engine</p>
          <h1>Turn a seed query into a demand map, language bank, and strategy brief.</h1>
          <p className="hero-body">
            This MVP pulls search demand, Reddit signal, competitor positioning, landing-page
            patterns, and reviews into one operator-grade report. The intake stays lean. The
            synthesis is the product.
          </p>

          <div className="pill-list">
            {modules.map((module) => (
              <span className="pill" key={module}>
                {module}
              </span>
            ))}
          </div>
        </div>

        <aside className="glass-card hero-aside">
          <p className="aside-label">What comes out</p>
          <ul className="feature-list">
            <li>Core problems with evidence</li>
            <li>Emotional language and direct quotes</li>
            <li>Keyword clusters by intent</li>
            <li>Competitor angles and whitespace</li>
            <li>Messaging, funnel, and strategy direction</li>
          </ul>

          <div className="status-note">
            <strong>Required keys:</strong> `OPENAI_API_KEY` and `SERPAPI_KEY`
          </div>
        </aside>
      </section>

      <section className="landing-grid">
        <div className="form-card">
          <IntakeForm />
        </div>

        <div className="support-column">
          <article className="support-card">
            <p className="aside-label">Pipeline</p>
            <ol className="ordered-list">
              <li>Collect Google autocomplete, People Also Ask, and related searches.</li>
              <li>Mine Reddit threads and comments with engagement-weighted prioritization.</li>
              <li>Inspect competitor search/positioning signals if competitor brands are supplied.</li>
              <li>Scrape provided landing pages into structural conversion notes.</li>
              <li>Group reviews into triggers, objections, pain points, and trust signals.</li>
              <li>Synthesize everything into one structured report screen.</li>
            </ol>
          </article>

          <article className="support-card">
            <p className="aside-label">Review upload format</p>
            <p className="support-copy">
              Upload `.json` or `.csv`. For CSV, use columns `source`, `rating`, `title`, and
              `body`.
            </p>
            <p className="support-copy">
              Supported sources: `trustpilot`, `google`, `amazon`, or `other`.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}


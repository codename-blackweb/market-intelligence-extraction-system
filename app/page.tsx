import IntakeForm from "@/components/intake/IntakeForm";

const modules = [
  "Autocomplete",
  "People Also Ask",
  "Related searches",
  "Demand clustering",
  "Confidence scoring",
  "Classification pass",
  "Synthesis pass",
  "PDF report"
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Market Intelligence Engine</p>
          <h1>Turn one query into clusters, confidence, positioning, and strategy.</h1>
          <p className="hero-body">
            This deployable pass stays narrow on purpose: normalize live search demand, cluster the
            visible patterns, score confidence, classify market dynamics, and synthesize
            acquisition, positioning, and messaging direction into one report.
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
            <li>Demand clusters and confidence scoring</li>
            <li>Market classification</li>
            <li>Core growth constraint</li>
            <li>Top customer pains</li>
            <li>Hidden objections</li>
            <li>Acquisition angle, offer positioning, and messaging direction</li>
          </ul>

          <div className="status-note">
            <strong>Required keys:</strong> OpenAI key, SerpAPI key, and both model env vars
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
              <li>Fetch autocomplete, People Also Ask, and related searches from SerpAPI.</li>
              <li>Flatten everything into one clean string array.</li>
              <li>Run clustering, confidence, and classification with the analysis model.</li>
              <li>Run the strategy pass with the synthesis model.</li>
              <li>Render the output into a simple report screen.</li>
              <li>Export the report to PDF from the browser.</li>
            </ol>
          </article>

          <article className="support-card">
            <p className="aside-label">Route contract</p>
            <p className="support-copy">
              `/api/serp` returns normalized `serpData`. `/api/analyze` receives `query` plus that
              array and returns clusters, confidence, classification, and strategy JSON.
            </p>
            <p className="support-copy">
              The active path is intentionally lean so it can be deployed quickly without extra
              moving parts.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

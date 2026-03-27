"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { AuroraTextEffect } from "@/components/lightswind/aurora-text-effect";
import { BeamCircle } from "@/components/ui/beam-circle";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger
} from "@/components/lightswind/drawer";
import RippleLoader from "@/components/ui/RippleLoader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { ToggleTheme } from "@/components/ui/toggle-theme";
import { VideoText } from "@/components/ui/VideoText";
import { useMotionPolicy } from "@/lib/motion-policy";
import type { MarketAnalysisResponse } from "@/types/market-analysis";

const classificationRows = [
  ["Type", "core_type"],
  ["Model", "business_model"],
  ["Customer", "customer_type"],
  ["Intent", "intent_stage"],
  ["Behavior", "purchase_behavior"],
  ["Channel", "acquisition_channel"],
  ["Complexity", "value_complexity"],
  ["Risk", "risk_level"],
  ["Maturity", "market_maturity"],
  ["Competition", "competitive_structure"]
] as const;

const pipeline = [
  "Collects search demand signals from the seed query.",
  "Clusters visible demand into interpretable themes.",
  "Classifies the market across models, customers, intent, and risk.",
  "Synthesizes pains, objections, acquisition angles, and messaging direction.",
  "Packages the output into an exportable intelligence report."
];

const outputs = [
  "Structured demand map",
  "Emotional language bank",
  "Competitor positioning",
  "Conversion insights",
  "Strategic recommendations"
];

const RECENT_ANALYSES_STORAGE_KEY = "market-intelligence:recent-analyses:v1";
const MAX_SAVED_RUNS = 10;

type SuccessfulAnalysisResponse = Extract<MarketAnalysisResponse, { success: true }>;

type SavedAnalysisRun = {
  id: string;
  query: string;
  marketType: string;
  depth: string;
  createdAt: number;
  result: SuccessfulAnalysisResponse;
};

function isSuccessfulAnalysisResponse(value: unknown): value is SuccessfulAnalysisResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { success?: boolean }).success === true &&
      typeof (value as { query?: unknown }).query === "string" &&
      typeof (value as { generatedAt?: unknown }).generatedAt === "string"
  );
}

function loadSavedRuns() {
  if (typeof window === "undefined") {
    return [] as SavedAnalysisRun[];
  }

  const raw = window.localStorage.getItem(RECENT_ANALYSES_STORAGE_KEY);

  if (!raw) {
    return [] as SavedAnalysisRun[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as SavedAnalysisRun[];
    }

    return parsed
      .filter(
        (item): item is SavedAnalysisRun =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as { id?: unknown }).id === "string" &&
              typeof (item as { query?: unknown }).query === "string" &&
              typeof (item as { marketType?: unknown }).marketType === "string" &&
              typeof (item as { depth?: unknown }).depth === "string" &&
              typeof (item as { createdAt?: unknown }).createdAt === "number" &&
              isSuccessfulAnalysisResponse((item as { result?: unknown }).result)
          )
      )
      .slice(0, MAX_SAVED_RUNS);
  } catch {
    return [] as SavedAnalysisRun[];
  }
}

function persistSavedRuns(runs: SavedAnalysisRun[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    RECENT_ANALYSES_STORAGE_KEY,
    JSON.stringify(runs.slice(0, MAX_SAVED_RUNS))
  );
}

export default function Home() {
  const motionPolicy = useMotionPolicy();
  const [query, setQuery] = useState("");
  const [marketType, setMarketType] = useState("");
  const [depth, setDepth] = useState("standard");
  const [data, setData] = useState<MarketAnalysisResponse | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedAnalysisRun[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSavedRuns(loadSavedRuns());
  }, []);

  const restoreSavedRun = (savedRun: SavedAnalysisRun) => {
    setQuery(savedRun.query);
    setMarketType(savedRun.marketType);
    setDepth(savedRun.depth);
    setError("");
    setData(savedRun.result);
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          marketType,
          depth
        })
      });

      const json = (await res.json()) as MarketAnalysisResponse;
      console.log("analyze response", json);

      if (!json.success) {
        console.error("analyze error", json.error);
        setError(json.error || "Something went wrong.");
        setData(null);
        return;
      }

      setData(json);

      const savedRun: SavedAnalysisRun = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        query: json.query,
        marketType,
        depth,
        createdAt: Date.now(),
        result: json
      };

      setSavedRuns((currentRuns) => {
        const nextRuns = [savedRun, ...currentRuns].slice(0, MAX_SAVED_RUNS);
        persistSavedRuns(nextRuns);
        return nextRuns;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("analyze error", message);
      setError(message || "Something went wrong.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const el = document.getElementById("report");

    if (!el) {
      return;
    }

    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default;

    await html2pdf().from(el).save();
  };

  return (
    <main className="page-shell">
      {loading && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center loader-overlay">
          <RippleLoader
            duration={motionPolicy.loaderDuration}
            icon={<Brain />}
            logoColor="black"
            size={motionPolicy.loaderSize}
          />
        </div>
      )}

      <div className="fixed top-6 right-6 z-50">
        <ToggleTheme animationType="circle-spread" />
      </div>

      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-10 hero-stack">
          <AuroraTextEffect className="bg-transparent dark:bg-transparent" text="Market Intelligence Engine" />
          <div className="hero-orbiter">
            <BeamCircle size={motionPolicy.isMobile ? 320 : 400} />
          </div>
          <div className="hero-subtitle-video-wrap mx-auto flex justify-center px-6">
            <VideoText
              as="div"
              src="/assets/gradient-video.mp4"
              className="hero-subtitle-video mx-auto w-full max-w-[980px]"
              fontSize="clamp(1.22rem, 1.95vw, 1.62rem)"
              fontWeight={600}
              fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
              textAnchor="middle"
              dominantBaseline="middle"
              autoPlay
              muted
              loop
              preload="auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {motionPolicy.isMobile
                ? "Extract real demand.\nDecode intent.\nBuild positioning that converts."
                : "Extract real demand. Decode intent. Build positioning that converts."}
            </VideoText>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <input
                className="surface-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter seed query"
              />
            </div>

            <div className="card p-6">
              <select
                className="surface-input"
                value={marketType}
                onChange={(event) => setMarketType(event.target.value)}
              >
                <option value="">Select Market Type</option>
                <option value="service">Service</option>
                <option value="saas">SaaS</option>
                <option value="ecommerce">E-commerce</option>
                <option value="product">Product</option>
                <option value="marketplace">Marketplace</option>
                <option value="media">Media</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="card p-6">
              <select
                className="surface-input"
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
              >
                <option value="standard">Standard Analysis</option>
                <option value="deep">Deep Analysis</option>
                <option value="aggressive">Aggressive (Max Insights)</option>
              </select>
            </div>
          </div>

          <button className="btn-primary mt-10" disabled={loading} onClick={runAnalysis} type="button">
            <VideoText
              as="span"
              src="/assets/gradient-video.mp4"
              className="button-video-text button-video-text-run"
              fontSize="1rem"
              fontWeight={700}
              fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
              textAnchor="middle"
              dominantBaseline="middle"
              autoPlay
              muted
              loop
              preload="auto"
            >
              Run Intelligence
            </VideoText>
          </button>

          {error ? (
            <p className="field-copy result-copy" role="alert">
              Error: {error}
            </p>
          ) : null}
        </section>
      </ScrollReveal>

      {savedRuns.length ? (
        <ScrollReveal eager>
          <section className="max-w-7xl mx-auto px-6 pb-8 recent-analyses-shell">
            <div className="card p-6">
              <div className="recent-analyses-header">
                <p className="card-label">Recent Analyses</p>
              </div>
              <div className="recent-analyses-list">
                {savedRuns.map((savedRun) => (
                  <button
                    className="recent-analysis-button"
                    key={savedRun.id}
                    onClick={() => restoreSavedRun(savedRun)}
                    type="button"
                  >
                    <span className="recent-analysis-query">{savedRun.query}</span>
                    <span className="recent-analysis-meta">
                      {savedRun.result.source_meta.mode} •{" "}
                      {new Date(savedRun.createdAt).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      ) : null}

      {data && data.success && (
        <>
          <ScrollReveal eager>
            <section className="max-w-5xl mx-auto py-20 space-y-12">
              <div className="results-toolbar">
                <button className="btn-secondary" onClick={exportPDF} type="button">
                  Export PDF
                </button>
              </div>

              <div className="space-y-12" id="report">
                <ScrollReveal eager>
                  <section className="card p-6">
                    <p className="card-label">Source Activity</p>
                    <div className="source-activity-strip" aria-label="Source activity">
                      <span
                        className={`source-activity-item ${
                          data.source_meta.used_google ? "is-active" : "is-inactive"
                        }`}
                      >
                        Google <span aria-hidden="true">{data.source_meta.used_google ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          data.source_meta.used_reddit ? "is-active" : "is-inactive"
                        }`}
                      >
                        Reddit <span aria-hidden="true">{data.source_meta.used_reddit ? "●" : "○"}</span>
                      </span>
                      <span
                        className={`source-activity-item ${
                          data.source_meta.used_openai ? "is-active" : "is-inactive"
                        }`}
                      >
                        OpenAI <span aria-hidden="true">{data.source_meta.used_openai ? "●" : "○"}</span>
                      </span>
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <p className="card-label">Dominant Narrative</p>
                    <p className="dominant-narrative-copy">{data.dominant_narrative}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Market Diagnosis</h2>
                    <div className="result-grid diagnosis-grid">
                      <div className="subcard">
                        <h3>Type</h3>
                        <p>{data.market_diagnosis.market_type}</p>
                      </div>
                      <div className="subcard">
                        <h3>Demand</h3>
                        <p>{data.market_diagnosis.demand_state}</p>
                      </div>
                      <div className="subcard">
                        <h3>Intent</h3>
                        <p>{data.market_diagnosis.intent_level}</p>
                      </div>
                      <div className="subcard">
                        <h3>Risk</h3>
                        <p>{data.market_diagnosis.risk_level}</p>
                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Signal Strength</h2>
                    <div
                      aria-hidden="true"
                      className="signal-strength-meter"
                    >
                      <span
                        className="signal-strength-meter-bar"
                        style={{ width: `${Math.max(0, Math.min(100, data.signal_strength.confidence_score))}%` }}
                      />
                    </div>
                    <div className="result-grid breakdown-grid">
                      <div className="subcard">
                        <h3>Strength</h3>
                        <p>{data.signal_strength.strength}</p>
                      </div>
                      <div className="subcard">
                        <h3>Confidence</h3>
                        <p>{data.signal_strength.confidence_score}%</p>
                      </div>
                      <div className="subcard">
                        <h3>Pattern</h3>
                        <p>{data.signal_strength.pattern_consistency}</p>
                      </div>
                    </div>
                    <p className="field-copy result-copy">{data.confidence?.reason}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Demand Clusters</h2>
                    <div className="stack">
                      {data.clusters.clusters.map((cluster) => (
                        <div className="subcard" key={cluster.theme}>
                          <h3>
                            {cluster.theme} — {cluster.frequency} signals
                          </h3>
                          <ul className="result-list">
                            {cluster.queries.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Market Gaps</h2>
                    <ul className="result-list">
                      {data.market_gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Positioning Strategy</h2>
                    <div className="result-grid breakdown-grid">
                      <div className="subcard">
                        <h3>Emphasize</h3>
                        <ul className="result-list">
                          {data.positioning_strategy.emphasize.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="subcard">
                        <h3>Avoid</h3>
                        <ul className="result-list">
                          {data.positioning_strategy.avoid.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="subcard">
                        <h3>Blindspots</h3>
                        <ul className="result-list">
                          {data.positioning_strategy.competitor_blindspots.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6 recommended-move-card">
                    <h2>Recommended Move</h2>
                    <p className="recommended-move-copy">{data.recommended_move}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Executive Summary</h2>
                    <ul className="result-list">
                      {data.executive_summary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Confidence Score</h2>
                    <p>{data.confidence?.confidence_score || "N/A"}</p>
                    <p>{data.confidence?.reason}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Demand Clusters</h2>
                    <div className="result-grid single-column-results">
                      {data.clusters?.clusters?.map((cluster) => (
                        <div className="subcard" key={cluster.theme}>
                          <h3>
                            {cluster.theme} — {cluster.frequency} signals
                          </h3>
                          <ul className="result-list">
                            {cluster.queries.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Market Breakdown</h2>
                    <div className="result-grid breakdown-grid">
                      {classificationRows.map(([label, key]) => (
                        <div className="subcard" key={key}>
                          <h3>{label}</h3>
                          <p>{data.classification?.[key]}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Core Constraint</h2>
                    <p>{data.strategy?.core_constraint}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Customer Pains</h2>
                    <ul className="result-list">
                      {data.strategy?.pains?.map((pain) => (
                        <li key={pain}>{pain}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Hidden Objections</h2>
                    <ul className="result-list">
                      {data.strategy?.objections?.map((objection) => (
                        <li key={objection}>{objection}</li>
                      ))}
                    </ul>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Acquisition Angle</h2>
                    <p>{data.strategy?.acquisition_angle}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Messaging Direction</h2>
                    <p>{data.strategy?.messaging}</p>
                  </section>
                </ScrollReveal>

                <ScrollReveal eager>
                  <section className="card p-6">
                    <h2>Offer Positioning</h2>
                    <p>{data.strategy?.offer_positioning}</p>
                  </section>
                </ScrollReveal>
              </div>
            </section>
          </ScrollReveal>
        </>
      )}

      <ScrollReveal eager>
        <section className="max-w-5xl mx-auto px-6 pb-24 drawer-trigger-section">
          <Drawer>
            <DrawerTrigger className="btn-primary" type="button">
              <VideoText
                as="span"
                src="/assets/gradient-video.mp4"
                className="button-video-text button-video-text-pipeline"
                fontSize="1rem"
                fontWeight={700}
                fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                textAnchor="middle"
                dominantBaseline="middle"
                autoPlay
                muted
                loop
                preload="auto"
              >
                How It Works
              </VideoText>
            </DrawerTrigger>

            <DrawerContent>
              <div className="drawer-grid-shell p-4">
                <div className="card p-6">
                  <VideoText
                    as="h2"
                    src="/assets/gradient-video.mp4"
                    className="drawer-video-heading drawer-video-heading-pipeline"
                    fontSize="clamp(1.2rem, 1.8vw, 1.45rem)"
                    fontWeight={700}
                    fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                    textAnchor="middle"
                    dominantBaseline="middle"
                    autoPlay
                    muted
                    loop
                    preload="auto"
                  >
                    Pipeline
                  </VideoText>
                  <ol className="result-list numbered-list">
                    {pipeline.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="card p-6">
                  <VideoText
                    as="h2"
                    src="/assets/gradient-video.mp4"
                    className="drawer-video-heading drawer-video-heading-output"
                    fontSize="clamp(1.2rem, 1.8vw, 1.45rem)"
                    fontWeight={700}
                    fontFamily='"Manrope", "Avenir Next", "Inter", "Helvetica Neue", sans-serif'
                    textAnchor="middle"
                    dominantBaseline="middle"
                    autoPlay
                    muted
                    loop
                    preload="auto"
                  >
                    Intelligence Output
                  </VideoText>
                  <ul className="result-list">
                    {outputs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </section>
      </ScrollReveal>
    </main>
  );
}

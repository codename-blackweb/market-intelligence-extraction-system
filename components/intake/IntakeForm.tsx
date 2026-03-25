"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReviewUpload from "@/components/intake/ReviewUpload";
import { createReportId, saveReport } from "@/lib/report-store";
import { getErrorMessage, splitListInput } from "@/lib/utils";
import type { MarketType, ReviewInput } from "@/types/intake";
import type { FinalReport } from "@/types/report";

const marketTypeOptions: Array<{ value: MarketType; label: string }> = [
  { value: "service", label: "Service" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "product", label: "Product" },
  { value: "other", label: "Other" }
];

export default function IntakeForm() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [seedQuery, setSeedQuery] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [landingPageUrls, setLandingPageUrls] = useState("");
  const [subreddits, setSubreddits] = useState("smallbusiness\nmarketing\nentrepreneur");
  const [marketType, setMarketType] = useState<MarketType>("service");
  const [reviews, setReviews] = useState<ReviewInput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const isBusy = isRunning || isNavigating;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsRunning(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          seedQuery,
          competitors: splitListInput(competitors),
          landingPageUrls: splitListInput(landingPageUrls),
          subreddits: splitListInput(subreddits),
          marketType,
          reviews
        })
      });

      const payload = (await response.json()) as FinalReport | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "The analysis request failed."
        );
      }

      const reportId = createReportId(seedQuery);
      saveReport(reportId, payload as FinalReport);

      startTransition(() => {
        router.push(`/report/${reportId}`);
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <form className="stack-xl" onSubmit={handleSubmit}>
      <header className="form-header">
        <p className="eyebrow">Intake</p>
        <h2>Run a lean market-intelligence pass.</h2>
        <p>
          Start with the seed query. Everything else is optional enrichment that sharpens the
          synthesis layer.
        </p>
      </header>

      <div className="stack-lg">
        <div className="field">
          <label htmlFor="seed-query">Seed query</label>
          <input
            id="seed-query"
            className="text-input"
            placeholder="why is my business not growing"
            value={seedQuery}
            onChange={(event) => setSeedQuery(event.target.value)}
            required
          />
          <span className="field-hint">
            Use the exact market question, demand phrase, or problem statement you want to map.
          </span>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="market-type">Market type</label>
            <select
              id="market-type"
              className="select-input"
              value={marketType}
              onChange={(event) => setMarketType(event.target.value as MarketType)}
            >
              {marketTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="subreddits">Subreddits</label>
            <textarea
              id="subreddits"
              className="text-area"
              value={subreddits}
              onChange={(event) => setSubreddits(event.target.value)}
              placeholder="smallbusiness&#10;marketing&#10;entrepreneur"
            />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="competitors">Competitor brands</label>
            <textarea
              id="competitors"
              className="text-area"
              value={competitors}
              onChange={(event) => setCompetitors(event.target.value)}
              placeholder="HubSpot&#10;Klaviyo&#10;GrowthMentor"
            />
            <span className="field-hint">
              One per line or comma-separated. These power the competitor messaging pass.
            </span>
          </div>

          <div className="field">
            <label htmlFor="landing-page-urls">Landing page URLs</label>
            <textarea
              id="landing-page-urls"
              className="text-area"
              value={landingPageUrls}
              onChange={(event) => setLandingPageUrls(event.target.value)}
              placeholder="https://example.com&#10;https://example.com/pricing"
            />
            <span className="field-hint">
              Use competitor or offer pages you want structurally analyzed.
            </span>
          </div>
        </div>
      </div>

      <ReviewUpload
        reviews={reviews}
        onChange={(nextReviews) => {
          setReviews(nextReviews);
          setUploadMessage(
            nextReviews.length
              ? `${nextReviews.length} review${nextReviews.length === 1 ? "" : "s"} loaded.`
              : null
          );
        }}
      />

      {uploadMessage ? <div className="success-banner">{uploadMessage}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="button-row">
        <button className="primary-button" disabled={isBusy} type="submit">
          {isBusy ? "Running intelligence..." : "Run Intelligence"}
        </button>
        <div className="micro-note">Results are stored in local browser storage for this MVP.</div>
      </div>
    </form>
  );
}


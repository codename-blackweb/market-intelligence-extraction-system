"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReportId, saveReport } from "@/lib/report-store";
import { getErrorMessage } from "@/lib/utils";
import type {
  MarketAnalysisResponse,
  SerpDataResponse
} from "@/types/market-analysis";

export default function IntakeForm() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isRunning || isNavigating;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsRunning(true);
    setStatus("Pulling live search signals...");

    try {
      const serpResponse = await fetch("/api/serp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });

      const serpPayload = (await serpResponse.json()) as SerpDataResponse;

      if (!serpResponse.ok || !serpPayload.success) {
        throw new Error(
          "error" in serpPayload ? serpPayload.error : "Failed to collect SERP data."
        );
      }

      setStatus("Running classification and synthesis...");

      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          serpData: serpPayload.serpData
        })
      });

      const analysisPayload = (await analysisResponse.json()) as MarketAnalysisResponse;

      if (!analysisResponse.ok || !analysisPayload.success) {
        throw new Error(
          "error" in analysisPayload ? analysisPayload.error : "The analysis request failed."
        );
      }

      const reportId = createReportId(query);
      saveReport(reportId, {
        query: analysisPayload.query,
        serpData: analysisPayload.serpData,
        classification: analysisPayload.classification,
        strategy: analysisPayload.strategy,
        generatedAt: analysisPayload.generatedAt
      });

      startTransition(() => {
        router.push(`/report/${reportId}`);
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setStatus(null);
      setIsRunning(false);
    }
  }

  return (
    <form className="stack-xl" onSubmit={handleSubmit}>
      <header className="form-header">
        <p className="eyebrow">Intake</p>
        <h2>Run the deployable two-pass market analysis.</h2>
        <p>
          Enter one real query. The app normalizes SerpAPI demand signals into a flat array, then
          runs a classification pass followed by a synthesis pass.
        </p>
      </header>

      <div className="field">
        <label htmlFor="market-query">Market query</label>
        <input
          id="market-query"
          className="text-input"
          placeholder="why is my business not growing"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <span className="field-hint">
          Keep it specific and problem-aware. The backend trims the SERP dataset to a flat array of
          50 strings max before analysis.
        </span>
      </div>

      {status ? <div className="info-banner">{status}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="button-row">
        <button className="primary-button" disabled={isBusy} type="submit">
          {isBusy ? "Running analysis..." : "Run Analysis"}
        </button>
        <div className="micro-note">Results are stored in local browser storage for this MVP.</div>
      </div>
    </form>
  );
}

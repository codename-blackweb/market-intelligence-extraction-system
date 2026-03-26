"use client";

import { useState } from "react";
import type { MarketAnalysisResponse } from "@/types/market-analysis";

export default function Home() {
  const [query, setQuery] = useState("");
  const [marketType, setMarketType] = useState("");
  const [depth, setDepth] = useState("standard");
  const [data, setData] = useState<MarketAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);

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
      setData(json);
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
    <main style={{ padding: 40 }}>
      <h1>Market Intelligence Engine</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter seed query"
          style={{ width: "100%", padding: 10 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <select
          value={marketType}
          onChange={(event) => setMarketType(event.target.value)}
          style={{ padding: 10, width: "100%" }}
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

      <div style={{ marginBottom: 20 }}>
        <select
          value={depth}
          onChange={(event) => setDepth(event.target.value)}
          style={{ padding: 10, width: "100%" }}
        >
          <option value="standard">Standard Analysis</option>
          <option value="deep">Deep Analysis</option>
          <option value="aggressive">Aggressive (Max Insights)</option>
        </select>
      </div>

      <button onClick={runAnalysis} disabled={loading}>
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {data && data.success && (
        <>
          <button onClick={exportPDF} style={{ marginTop: 20 }}>
            Export PDF
          </button>

          <div id="report" style={{ marginTop: 40 }}>
            <section>
              <h2>Confidence Score</h2>
              <p>{data.confidence?.confidence_score || "N/A"}</p>
              <p>{data.confidence?.reason}</p>
            </section>

            <section>
              <h2>Demand Clusters</h2>
              {data.clusters?.clusters?.map((cluster) => (
                <div key={cluster.theme}>
                  <h3>{cluster.theme}</h3>
                  <ul>
                    {cluster.queries.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section>
              <h2>Market Breakdown</h2>
              <p>Type: {data.classification?.core_type}</p>
              <p>Model: {data.classification?.business_model}</p>
              <p>Customer: {data.classification?.customer_type}</p>
              <p>Intent: {data.classification?.intent_stage}</p>
              <p>Behavior: {data.classification?.purchase_behavior}</p>
              <p>Channel: {data.classification?.acquisition_channel}</p>
              <p>Complexity: {data.classification?.value_complexity}</p>
              <p>Risk: {data.classification?.risk_level}</p>
              <p>Maturity: {data.classification?.market_maturity}</p>
              <p>Competition: {data.classification?.competitive_structure}</p>
            </section>

            <section>
              <h2>Core Constraint</h2>
              <p>{data.strategy?.core_constraint}</p>
            </section>

            <section>
              <h2>Customer Pains</h2>
              <ul>
                {data.strategy?.pains?.map((pain) => (
                  <li key={pain}>{pain}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Hidden Objections</h2>
              <ul>
                {data.strategy?.objections?.map((objection) => (
                  <li key={objection}>{objection}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Acquisition Angle</h2>
              <p>{data.strategy?.acquisition_angle}</p>
            </section>

            <section>
              <h2>Messaging Direction</h2>
              <p>{data.strategy?.messaging}</p>
            </section>

            <section>
              <h2>Offer Positioning</h2>
              <p>{data.strategy?.offer_positioning}</p>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

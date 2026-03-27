import type { MarketAnalysisReport } from "@/types/market-analysis";
import { safeJsonParse, slugify } from "@/lib/utils";

const STORAGE_PREFIX = "market-intel-report:";

export function createReportId(seedQuery: string) {
  return `${slugify(seedQuery) || "market-report"}-${Date.now().toString(36)}`;
}

export function saveReport(reportId: string, report: MarketAnalysisReport) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify(report));
}

export function loadReport(reportId: string): MarketAnalysisReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);

  if (!raw) {
    return null;
  }

  const parsed = safeJsonParse<Partial<MarketAnalysisReport>>(raw);

  if (!parsed || !parsed.query || !parsed.serpData || !parsed.classification || !parsed.strategy) {
    return null;
  }

  return {
    query: parsed.query,
    serpData: parsed.serpData,
    normalized_signals:
      parsed.normalized_signals?.map((signal) => ({
        text: signal.text ?? "",
        source:
          typeof signal.source === "string" ? signal.source : "Autocomplete",
        weight: typeof signal.weight === "number" ? signal.weight : 1
      })) ?? [],
    signal_origins:
      parsed.signal_origins?.map((origin) => ({
        text: origin.text ?? "",
        sources:
          origin.sources?.filter((source): source is "Autocomplete" | "PAA" | "Related Searches" | "Reddit" | "YouTube" | "Amazon" | "News" | "Competitor" =>
            typeof source === "string"
          ) ?? []
      })) ?? [],
    clusters: {
      clusters:
        parsed.clusters?.clusters?.map((cluster) => ({
          theme: cluster.theme ?? "",
          frequency: cluster.frequency ?? cluster.queries?.length ?? 0,
          queries: cluster.queries ?? []
        })) ?? []
    },
    dominant_narrative: parsed.dominant_narrative ?? "",
    market_diagnosis: parsed.market_diagnosis ?? {
      market_type: "",
      demand_state: "",
      intent_level: "",
      risk_level: ""
    },
    signal_strength: parsed.signal_strength ?? {
      strength: "",
      confidence_score: 0,
      pattern_consistency: ""
    },
    market_gaps: parsed.market_gaps ?? [],
    positioning_strategy: parsed.positioning_strategy ?? {
      emphasize: [],
      avoid: [],
      competitor_blindspots: []
    },
    recommended_move: parsed.recommended_move ?? "",
    executive_summary: parsed.executive_summary ?? [],
    confidence: parsed.confidence ?? {
      confidence_score: "N/A",
      reason: "This report was generated before confidence scoring was added."
    },
    classification: parsed.classification,
    strategy: {
      ...parsed.strategy,
      offer_positioning: parsed.strategy.offer_positioning ?? ""
    },
    source_meta: {
      mode:
        parsed.source_meta?.mode === "HYBRID" || parsed.source_meta?.mode === "LIVE"
          ? parsed.source_meta.mode
          : "DEV",
      used_google: parsed.source_meta?.used_google ?? true,
      used_reddit: parsed.source_meta?.used_reddit ?? false,
      used_openai: parsed.source_meta?.used_openai ?? true,
      used_youtube: parsed.source_meta?.used_youtube ?? false,
      used_amazon: parsed.source_meta?.used_amazon ?? false,
      used_news: parsed.source_meta?.used_news ?? false,
      used_competitors: parsed.source_meta?.used_competitors ?? false,
      google_signal_count: parsed.source_meta?.google_signal_count ?? parsed.serpData.length,
      reddit_signal_count: parsed.source_meta?.reddit_signal_count ?? 0,
      youtube_signal_count: parsed.source_meta?.youtube_signal_count ?? 0,
      amazon_signal_count: parsed.source_meta?.amazon_signal_count ?? 0,
      news_signal_count: parsed.source_meta?.news_signal_count ?? 0,
      competitor_signal_count: parsed.source_meta?.competitor_signal_count ?? 0
    },
    competitor_context: parsed.competitor_context ?? {
      competitor_names: [],
      competitor_urls: [],
      niche: ""
    },
    ai_confidence_score: parsed.ai_confidence_score ?? 0,
    synthesis_depth: parsed.synthesis_depth === "deep" ? "deep" : "standard",
    reasoning_quality:
      parsed.reasoning_quality === "high" || parsed.reasoning_quality === "low"
        ? parsed.reasoning_quality
        : "medium",
    fallback_used: parsed.fallback_used ?? false,
    generatedAt: parsed.generatedAt ?? new Date().toISOString()
  };
}

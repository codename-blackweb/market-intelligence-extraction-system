import type { PersistedAnalysisRecord } from "@/types/market-analysis";

export type IntentMixSegmentTone = "aqua" | "cyan" | "amber" | "emerald";

export type IntentMixSegment = {
  label: string;
  percentage: number;
  tone: IntentMixSegmentTone;
};

export type PendingAnalysisDraft = {
  query: string;
  marketType: string;
  depth: string;
  competitorNames: string;
  competitorUrls: string;
  niche: string;
};

export type AnalysisDisplayRecord = {
  id: string;
  analysis: PersistedAnalysisRecord;
  query: string;
  dominantNarrative: string;
  marketType: string;
  depth: string;
  mode: string;
  isPublic: boolean;
  createdAt: string;
  confidenceScore: number;
  intentStage: string;
  intentMix: IntentMixSegment[];
  signalCount: number;
  tags: string[];
};

export type WorkspaceFilters = {
  search: string;
  depths: string[];
  modes: string[];
  visibility: Array<"public" | "private">;
  intentStages: string[];
};

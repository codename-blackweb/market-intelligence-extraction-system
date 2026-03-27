export type MarketClassification = {
  core_type: string;
  business_model: string;
  customer_type: string;
  intent_stage: string;
  purchase_behavior: string;
  acquisition_channel: string;
  value_complexity: string;
  risk_level: string;
  market_maturity: string;
  competitive_structure: string;
};

export type MarketStrategy = {
  core_constraint: string;
  pains: string[];
  objections: string[];
  acquisition_angle: string;
  messaging: string;
  offer_positioning: string;
};

export type DemandCluster = {
  theme: string;
  frequency: number;
  queries: string[];
};

export type MarketClusters = {
  clusters: DemandCluster[];
};

export type MarketDiagnosis = {
  market_type: string;
  demand_state: string;
  intent_level: string;
  risk_level: string;
};

export type MarketSignalStrength = {
  strength: string;
  confidence_score: number;
  pattern_consistency: string;
};

export type SignalSourceTag =
  | "Autocomplete"
  | "PAA"
  | "Related Searches"
  | "Reddit"
  | "YouTube"
  | "Amazon"
  | "News"
  | "Competitor";

export type NormalizedSignal = {
  text: string;
  source: SignalSourceTag;
  weight: number;
};

export type SignalOriginEntry = {
  text: string;
  sources: SignalSourceTag[];
};

export type MarketSourceMeta = {
  mode: "DEV" | "HYBRID" | "LIVE";
  used_google: boolean;
  used_reddit: boolean;
  used_openai: boolean;
  used_youtube: boolean;
  used_amazon: boolean;
  used_news: boolean;
  used_competitors: boolean;
  google_signal_count: number;
  reddit_signal_count: number;
  youtube_signal_count: number;
  amazon_signal_count: number;
  news_signal_count: number;
  competitor_signal_count: number;
};

export type CompetitorContext = {
  competitor_names: string[];
  competitor_urls: string[];
  niche: string;
};

export type UserPlan = "free" | "pro" | "agency";

export type MarketPositioningStrategy = {
  emphasize: string[];
  avoid: string[];
  competitor_blindspots: string[];
};

export type MarketSynthesis = {
  dominant_narrative: string;
  market_diagnosis: MarketDiagnosis;
  signal_strength: MarketSignalStrength;
  clusters: DemandCluster[];
  core_constraint: string;
  pains: string[];
  objections: string[];
  market_gaps: string[];
  positioning_strategy: MarketPositioningStrategy;
  recommended_move: string;
  executive_summary: string[];
};

export type MarketConfidence = {
  confidence_score: string | number;
  reason: string;
};

export type MarketAnalysisReport = {
  query: string;
  serpData: string[];
  normalized_signals: NormalizedSignal[];
  signal_origins: SignalOriginEntry[];
  clusters: MarketClusters;
  dominant_narrative: string;
  market_diagnosis: MarketDiagnosis;
  signal_strength: MarketSignalStrength;
  market_gaps: string[];
  positioning_strategy: MarketPositioningStrategy;
  recommended_move: string;
  executive_summary: string[];
  confidence: MarketConfidence;
  classification: MarketClassification;
  strategy: MarketStrategy;
  source_meta: MarketSourceMeta;
  competitor_context: CompetitorContext;
  ai_confidence_score: number;
  synthesis_depth: "standard" | "deep";
  reasoning_quality: "high" | "medium" | "low";
  fallback_used: boolean;
  generatedAt: string;
};

export type PersistedAnalysisRecord = {
  id: string;
  user_id: string;
  query: string;
  market_type: string;
  depth: string;
  result_json: MarketAnalysisSuccessResponse;
  is_public: boolean;
  created_at: string;
};

export type UserProfileRecord = {
  user_id: string;
  plan: UserPlan;
  created_at?: string;
  updated_at?: string;
};

export type MarketAnalysisSuccessResponse = {
  success: true;
  query: string;
  serpData: string[];
  normalized_signals: NormalizedSignal[];
  signal_origins: SignalOriginEntry[];
  clusters: MarketClusters;
  dominant_narrative: string;
  market_diagnosis: MarketDiagnosis;
  signal_strength: MarketSignalStrength;
  market_gaps: string[];
  positioning_strategy: MarketPositioningStrategy;
  recommended_move: string;
  executive_summary: string[];
  confidence: MarketConfidence;
  classification: MarketClassification;
  strategy: MarketStrategy;
  source_meta: MarketSourceMeta;
  competitor_context: CompetitorContext;
  ai_confidence_score: number;
  synthesis_depth: "standard" | "deep";
  reasoning_quality: "high" | "medium" | "low";
  fallback_used: boolean;
  generatedAt: string;
};

export type GeneratedActionKind =
  | "positioning_statement"
  | "ad_angles"
  | "landing_page_hook"
  | "email_angle";

export type GeneratedActionsSuccessResponse = {
  success: true;
  kind: GeneratedActionKind;
  outputs: string[];
  fallback_used: boolean;
};

export type GeneratedActionsErrorResponse = {
  success: false;
  error: string;
};

export type MarketAnalysisErrorResponse = {
  success: false;
  error: string;
};

export type MarketAnalysisResponse =
  | MarketAnalysisSuccessResponse
  | MarketAnalysisErrorResponse;

export type GeneratedActionsResponse =
  | GeneratedActionsSuccessResponse
  | GeneratedActionsErrorResponse;

export type SerpDataSuccessResponse = {
  success: true;
  query: string;
  serpData: string[];
};

export type SerpDataErrorResponse = {
  success: false;
  error: string;
};

export type SerpDataResponse = SerpDataSuccessResponse | SerpDataErrorResponse;

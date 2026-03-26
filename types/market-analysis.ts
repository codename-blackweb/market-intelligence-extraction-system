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
  confidence_score: string;
  reason: string;
};

export type MarketAnalysisReport = {
  query: string;
  serpData: string[];
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
  generatedAt: string;
};

export type MarketAnalysisSuccessResponse = {
  success: true;
  query: string;
  serpData: string[];
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
  generatedAt: string;
};

export type MarketAnalysisErrorResponse = {
  success: false;
  error: string;
};

export type MarketAnalysisResponse =
  | MarketAnalysisSuccessResponse
  | MarketAnalysisErrorResponse;

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

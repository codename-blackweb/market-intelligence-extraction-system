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
};

export type MarketAnalysisReport = {
  query: string;
  serpData: string[];
  classification: MarketClassification;
  strategy: MarketStrategy;
  generatedAt: string;
};

export type MarketAnalysisSuccessResponse = {
  success: true;
  query: string;
  serpData: string[];
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

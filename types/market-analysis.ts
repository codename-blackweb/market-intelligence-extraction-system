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

export type GateType =
  | "analysis_limit"
  | "live_limit"
  | "export"
  | "deep_synthesis"
  | "generator"
  | "agency_only"
  | "competitor_enrichment";

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
  workspace_id: string | null;
  query: string;
  market_type: string;
  depth: string;
  result_json: MarketAnalysisSuccessResponse;
  created_at: string;
  shared_report?: SharedReportRecord | null;
  is_public?: boolean;
};

export type UserProfileRecord = {
  id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  avatar_url?: string | null;
  created_at: string;
};

export type WorkspaceRecord = {
  id: string;
  owner_id: string;
  name: string;
  primary_use_case: string;
  team_size: string;
  industry: string;
  created_at: string;
};

export type WorkspaceMemberRecord = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  role: string;
  invited_email: string | null;
  status: string;
  created_at: string;
};

export type WorkspaceInviteRecord = WorkspaceMemberRecord;

export type SubscriptionRecord = {
  id: string;
  user_id: string;
  plan: UserPlan;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SharedReportRecord = {
  id: string;
  analysis_id: string;
  user_id: string;
  public_token: string;
  is_public: boolean;
  created_at: string;
};

export type AuthSessionUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string | null;
  created_at?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthSessionUser;
};

export type AccountSummaryResponse = {
  success: boolean;
  persistenceConfigured?: boolean;
  profile?: UserProfileRecord | null;
  subscription?: SubscriptionRecord | null;
  usage?: PlanUsageSummary;
  workspace?: WorkspaceRecord | null;
  workspaces?: WorkspaceRecord[];
  members?: WorkspaceMemberRecord[];
  invites?: WorkspaceInviteRecord[];
  analyses?: PersistedAnalysisRecord[];
  sharedReports?: SharedReportRecord[];
  sharedReportsCount?: number;
  savedAnalysesCount?: number;
  error?: string;
};

export type PlanUsageSummary = {
  plan: UserPlan;
  subscription_status: string;
  live_runs_today: number;
  live_runs_limit: number | null;
  live_runs_remaining: number | null;
  deep_synthesis_enabled: boolean;
  generators_enabled: boolean;
  export_enabled: boolean;
  compare_enabled: boolean;
  competitor_inputs_enabled: boolean;
  source_evidence_enabled: boolean;
  multi_workspace_enabled: boolean;
  team_features_enabled: boolean;
  white_label_enabled: boolean;
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
  analysis_id?: string | null;
  analysis_is_public?: boolean;
  usage?: PlanUsageSummary;
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
  gated?: boolean;
  gate_type?: GateType;
  message?: string;
};

export type MarketAnalysisErrorResponse = {
  success: false;
  error: string;
  gated?: boolean;
  gate_type?: GateType;
  message?: string;
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

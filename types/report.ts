import type { MarketType } from "@/types/intake";

export type GoogleProblemCluster = {
  problem_name: string;
  exact_phrases: string[];
  autocomplete_variations: string[];
  hidden_objections: string[];
  deeper_problem_layers: string[];
  related_expansions: string[];
  repeated_patterns: string[];
};

export type GoogleDemandAnalysis = {
  problem_clusters: GoogleProblemCluster[];
  global_patterns: string[];
  notable_objections: string[];
  high_intent_signals: string[];
};

export type RedditTheme = {
  theme_name: string;
  supporting_quotes: string[];
  frequency_estimate: string;
};

export type RedditVoiceAnalysis = {
  emotional_language: string[];
  exact_quotes: string[];
  repeated_complaints: string[];
  specific_blockers: string[];
  objections: string[];
  themes: RedditTheme[];
};

export type CompetitorAdBreakdown = {
  competitor: string;
  hook: string;
  pain_led_with: string;
  promise: string;
  cta: string;
  angle: string;
  notes: string;
};

export type CompetitorAdsAnalysis = {
  ads_analysis: CompetitorAdBreakdown[];
  recurring_hook_patterns: string[];
  recurring_angles: string[];
  recurring_ctas: string[];
  observed_conversion_signals: string[];
};

export type LandingPageAnalysis = {
  url: string;
  headline: string;
  headline_pattern: string;
  subheadline: string;
  primary_cta: string;
  secondary_ctas: string[];
  above_the_fold_strategy: string;
  proof_elements: string[];
  benefit_framing: string[];
  framework_or_method: string;
  urgency_elements: string[];
  guarantees: string[];
  positioning_notes: string[];
};

export type ReviewsAnalysis = {
  triggers: string[];
  objections: string[];
  pain_points: string[];
  trust_signals: string[];
  exact_quotes: string[];
  patterns: string[];
};

export type ProblemCluster = {
  problem_name: string;
  description?: string;
  evidence: string[];
  exact_phrases?: string[];
};

export type LanguageSection = {
  emotional_phrases: string[];
  high_value_quotes: string[];
  objection_language: string[];
};

export type KeywordCluster = {
  problem_name: string;
  keywords: string[];
  intent: string;
  recommended_use: string;
};

export type CompetitorAngle = {
  angle_name: string;
  description: string;
  evidence: string[];
};

export type RecommendedKeyword = {
  keyword: string;
  why_it_matters: string;
  recommended_use: string;
};

export type ReportMeta = {
  warnings: string[];
  modules_run: string[];
  source_counts: {
    autocomplete: number;
    people_also_ask: number;
    related_searches: number;
    reddit_threads: number;
    reddit_comments: number;
    competitor_blocks: number;
    landing_pages: number;
    reviews: number;
  };
};

export type FinalReport = {
  title?: string;
  seed_query?: string;
  generated_at?: string;
  market_type?: MarketType;
  meta?: ReportMeta;
  section_1_problems: ProblemCluster[];
  section_2_language: LanguageSection;
  section_3_keywords: KeywordCluster[];
  section_4_competitor_angles: CompetitorAngle[];
  section_5_gaps: string[];
  recommended_messaging: string[];
  recommended_keywords: RecommendedKeyword[];
  recommended_funnel_angles: string[];
  strategic_direction: string[];
};


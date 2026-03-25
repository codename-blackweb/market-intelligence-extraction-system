const STRING = { type: "string" } as const;
const STRING_ARRAY = {
  type: "array",
  items: STRING
} as const;

function objectSchema<T extends Record<string, unknown>>(
  properties: T,
  required: Array<keyof T>
) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required
  } as const;
}

export const googleAnalysisSchema = objectSchema(
  {
    problem_clusters: {
      type: "array",
      items: objectSchema(
        {
          problem_name: STRING,
          exact_phrases: STRING_ARRAY,
          autocomplete_variations: STRING_ARRAY,
          hidden_objections: STRING_ARRAY,
          deeper_problem_layers: STRING_ARRAY,
          related_expansions: STRING_ARRAY,
          repeated_patterns: STRING_ARRAY
        },
        [
          "problem_name",
          "exact_phrases",
          "autocomplete_variations",
          "hidden_objections",
          "deeper_problem_layers",
          "related_expansions",
          "repeated_patterns"
        ]
      )
    },
    global_patterns: STRING_ARRAY,
    notable_objections: STRING_ARRAY,
    high_intent_signals: STRING_ARRAY
  },
  ["problem_clusters", "global_patterns", "notable_objections", "high_intent_signals"]
);

export const redditAnalysisSchema = objectSchema(
  {
    emotional_language: STRING_ARRAY,
    exact_quotes: STRING_ARRAY,
    repeated_complaints: STRING_ARRAY,
    specific_blockers: STRING_ARRAY,
    objections: STRING_ARRAY,
    themes: {
      type: "array",
      items: objectSchema(
        {
          theme_name: STRING,
          supporting_quotes: STRING_ARRAY,
          frequency_estimate: STRING
        },
        ["theme_name", "supporting_quotes", "frequency_estimate"]
      )
    }
  },
  [
    "emotional_language",
    "exact_quotes",
    "repeated_complaints",
    "specific_blockers",
    "objections",
    "themes"
  ]
);

export const competitorAdsSchema = objectSchema(
  {
    ads_analysis: {
      type: "array",
      items: objectSchema(
        {
          competitor: STRING,
          hook: STRING,
          pain_led_with: STRING,
          promise: STRING,
          cta: STRING,
          angle: STRING,
          notes: STRING
        },
        ["competitor", "hook", "pain_led_with", "promise", "cta", "angle", "notes"]
      )
    },
    recurring_hook_patterns: STRING_ARRAY,
    recurring_angles: STRING_ARRAY,
    recurring_ctas: STRING_ARRAY,
    observed_conversion_signals: STRING_ARRAY
  },
  [
    "ads_analysis",
    "recurring_hook_patterns",
    "recurring_angles",
    "recurring_ctas",
    "observed_conversion_signals"
  ]
);

export const landingPageSchema = objectSchema(
  {
    headline: STRING,
    headline_pattern: STRING,
    subheadline: STRING,
    primary_cta: STRING,
    secondary_ctas: STRING_ARRAY,
    above_the_fold_strategy: STRING,
    proof_elements: STRING_ARRAY,
    benefit_framing: STRING_ARRAY,
    framework_or_method: STRING,
    urgency_elements: STRING_ARRAY,
    guarantees: STRING_ARRAY,
    positioning_notes: STRING_ARRAY
  },
  [
    "headline",
    "headline_pattern",
    "subheadline",
    "primary_cta",
    "secondary_ctas",
    "above_the_fold_strategy",
    "proof_elements",
    "benefit_framing",
    "framework_or_method",
    "urgency_elements",
    "guarantees",
    "positioning_notes"
  ]
);

export const reviewsAnalysisSchema = objectSchema(
  {
    triggers: STRING_ARRAY,
    objections: STRING_ARRAY,
    pain_points: STRING_ARRAY,
    trust_signals: STRING_ARRAY,
    exact_quotes: STRING_ARRAY,
    patterns: STRING_ARRAY
  },
  ["triggers", "objections", "pain_points", "trust_signals", "exact_quotes", "patterns"]
);

export const finalReportSchema = objectSchema(
  {
    section_1_problems: {
      type: "array",
      items: objectSchema(
        {
          problem_name: STRING,
          description: STRING,
          evidence: STRING_ARRAY
        },
        ["problem_name", "description", "evidence"]
      )
    },
    section_2_language: objectSchema(
      {
        emotional_phrases: STRING_ARRAY,
        high_value_quotes: STRING_ARRAY,
        objection_language: STRING_ARRAY
      },
      ["emotional_phrases", "high_value_quotes", "objection_language"]
    ),
    section_3_keywords: {
      type: "array",
      items: objectSchema(
        {
          problem_name: STRING,
          keywords: STRING_ARRAY,
          intent: STRING,
          recommended_use: STRING
        },
        ["problem_name", "keywords", "intent", "recommended_use"]
      )
    },
    section_4_competitor_angles: {
      type: "array",
      items: objectSchema(
        {
          angle_name: STRING,
          description: STRING,
          evidence: STRING_ARRAY
        },
        ["angle_name", "description", "evidence"]
      )
    },
    section_5_gaps: STRING_ARRAY,
    recommended_messaging: STRING_ARRAY,
    recommended_keywords: {
      type: "array",
      items: objectSchema(
        {
          keyword: STRING,
          why_it_matters: STRING,
          recommended_use: STRING
        },
        ["keyword", "why_it_matters", "recommended_use"]
      )
    },
    recommended_funnel_angles: STRING_ARRAY,
    strategic_direction: STRING_ARRAY
  },
  [
    "section_1_problems",
    "section_2_language",
    "section_3_keywords",
    "section_4_competitor_angles",
    "section_5_gaps",
    "recommended_messaging",
    "recommended_keywords",
    "recommended_funnel_angles",
    "strategic_direction"
  ]
);


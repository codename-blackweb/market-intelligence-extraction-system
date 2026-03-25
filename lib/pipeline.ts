import {
  buildCompetitorUserPrompt,
  buildFinalSynthesisUserPrompt,
  buildGoogleUserPrompt,
  buildLandingPageUserPrompt,
  buildRedditUserPrompt,
  buildReviewsUserPrompt,
  COMPETITOR_SYSTEM_PROMPT,
  FINAL_SYNTHESIS_SYSTEM_PROMPT,
  GOOGLE_SYSTEM_PROMPT,
  LANDING_PAGE_SYSTEM_PROMPT,
  REDDIT_SYSTEM_PROMPT,
  REVIEWS_SYSTEM_PROMPT
} from "@/lib/prompts";
import {
  competitorAdsSchema,
  finalReportSchema,
  googleAnalysisSchema,
  landingPageSchema,
  redditAnalysisSchema,
  reviewsAnalysisSchema
} from "@/lib/schemas";
import { callStructuredModel } from "@/lib/openai";
import {
  fetchAutocomplete,
  fetchCompetitorSearchIntel,
  fetchGoogleSearchIntel,
  normalizeAutocomplete,
  normalizeCompetitorBlocks,
  normalizeOrganicSnippets,
  normalizePeopleAlsoAsk,
  normalizeRelatedSearches
} from "@/lib/serpapi";
import { collectRedditCorpus } from "@/lib/reddit";
import { fetchLandingPageText } from "@/lib/scraper";
import { compactUnique, normalizeUrl } from "@/lib/utils";
import type { AnalyzePayload, ReviewInput } from "@/types/intake";
import type {
  CompetitorAdsAnalysis,
  FinalReport,
  GoogleDemandAnalysis,
  LandingPageAnalysis,
  ReportMeta,
  ReviewsAnalysis,
  RedditVoiceAnalysis
} from "@/types/report";

const EMPTY_GOOGLE: GoogleDemandAnalysis = {
  problem_clusters: [],
  global_patterns: [],
  notable_objections: [],
  high_intent_signals: []
};

const EMPTY_REDDIT: RedditVoiceAnalysis = {
  emotional_language: [],
  exact_quotes: [],
  repeated_complaints: [],
  specific_blockers: [],
  objections: [],
  themes: []
};

const EMPTY_COMPETITOR: CompetitorAdsAnalysis = {
  ads_analysis: [],
  recurring_hook_patterns: [],
  recurring_angles: [],
  recurring_ctas: [],
  observed_conversion_signals: []
};

const EMPTY_REVIEWS: ReviewsAnalysis = {
  triggers: [],
  objections: [],
  pain_points: [],
  trust_signals: [],
  exact_quotes: [],
  patterns: []
};

const EMPTY_REPORT: FinalReport = {
  section_1_problems: [],
  section_2_language: {
    emotional_phrases: [],
    high_value_quotes: [],
    objection_language: []
  },
  section_3_keywords: [],
  section_4_competitor_angles: [],
  section_5_gaps: [],
  recommended_messaging: [],
  recommended_keywords: [],
  recommended_funnel_angles: [],
  strategic_direction: []
};

async function settleStep<T>(
  label: string,
  warnings: string[],
  task: () => Promise<T>
): Promise<T | null> {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    warnings.push(`${label}: ${message}`);
    return null;
  }
}

function sanitizeReviews(reviews: ReviewInput[]) {
  return reviews
    .map((review) => ({
      source: review.source,
      rating: Number(review.rating),
      title: review.title?.trim(),
      body: review.body.trim()
    }))
    .filter((review) => Number.isFinite(review.rating) && review.body);
}

function finalizeReport(
  report: FinalReport,
  payload: AnalyzePayload,
  warnings: string[],
  sourceCounts: ReportMeta["source_counts"],
  modulesRun: string[]
): FinalReport {
  return {
    ...EMPTY_REPORT,
    ...report,
    title: "Market Intelligence Report",
    seed_query: payload.seedQuery,
    generated_at: new Date().toISOString(),
    market_type: payload.marketType,
    meta: {
      warnings,
      modules_run: compactUnique(modulesRun),
      source_counts: sourceCounts
    }
  };
}

export async function runPipeline(payload: AnalyzePayload): Promise<FinalReport> {
  const warnings: string[] = [];
  const modulesRun: string[] = [];

  const competitors = compactUnique(payload.competitors, 8);
  const landingPageUrls = compactUnique(payload.landingPageUrls, 6)
    .map(normalizeUrl)
    .filter((value): value is string => Boolean(value));
  const subreddits = compactUnique(payload.subreddits, 6);
  const reviews = sanitizeReviews(payload.reviews);

  const googleRaw = await settleStep("Google extraction", warnings, async () => {
    const [autocompleteRaw, searchRaw] = await Promise.all([
      fetchAutocomplete(payload.seedQuery),
      fetchGoogleSearchIntel(payload.seedQuery)
    ]);

    modulesRun.push("google");

    return {
      autocomplete: normalizeAutocomplete(autocompleteRaw),
      peopleAlsoAsk: normalizePeopleAlsoAsk(searchRaw),
      relatedSearches: normalizeRelatedSearches(searchRaw),
      organicSnippets: normalizeOrganicSnippets(searchRaw)
    };
  });

  const redditRaw = await settleStep("Reddit extraction", warnings, async () => {
    const corpus = await collectRedditCorpus(payload.seedQuery, subreddits);
    modulesRun.push("reddit");
    return corpus;
  });

  const competitorBlocks = (
    await Promise.all(
      competitors.map(async (competitor) => {
        const search = await settleStep(
          `Competitor extraction for ${competitor}`,
          warnings,
          () => fetchCompetitorSearchIntel(competitor, payload.seedQuery)
        );

        return search ? normalizeCompetitorBlocks(competitor, search) : [];
      })
    )
  ).flat();

  if (competitorBlocks.length) {
    modulesRun.push("competitor");
  }

  const landingSources = (
    await Promise.all(
      landingPageUrls.map((url) =>
        settleStep(`Landing page fetch for ${url}`, warnings, () => fetchLandingPageText(url))
      )
    )
  ).filter((value): value is Awaited<ReturnType<typeof fetchLandingPageText>> => Boolean(value));

  if (landingSources.length) {
    modulesRun.push("landing-page");
  }

  if (reviews.length) {
    modulesRun.push("reviews");
  }

  const sourceCounts = {
    autocomplete: googleRaw?.autocomplete.length ?? 0,
    people_also_ask: googleRaw?.peopleAlsoAsk.length ?? 0,
    related_searches: googleRaw?.relatedSearches.length ?? 0,
    reddit_threads: redditRaw?.threads.length ?? 0,
    reddit_comments: redditRaw?.comments.length ?? 0,
    competitor_blocks: competitorBlocks.length,
    landing_pages: landingSources.length,
    reviews: reviews.length
  };

  const googleAnalysisPromise = googleRaw
    ? callStructuredModel<GoogleDemandAnalysis>({
        schemaName: "google_demand_analysis",
        schema: googleAnalysisSchema,
        systemPrompt: GOOGLE_SYSTEM_PROMPT,
        userPrompt: buildGoogleUserPrompt({
          seedQuery: payload.seedQuery,
          marketType: payload.marketType,
          autocomplete: googleRaw.autocomplete,
          peopleAlsoAsk: googleRaw.peopleAlsoAsk,
          relatedSearches: googleRaw.relatedSearches,
          organicSnippets: googleRaw.organicSnippets
        }),
        maxOutputTokens: 2400
      })
    : Promise.resolve(EMPTY_GOOGLE);

  const redditAnalysisPromise = redditRaw
    ? callStructuredModel<RedditVoiceAnalysis>({
        schemaName: "reddit_voice_analysis",
        schema: redditAnalysisSchema,
        systemPrompt: REDDIT_SYSTEM_PROMPT,
        userPrompt: buildRedditUserPrompt({
          seedQuery: payload.seedQuery,
          marketType: payload.marketType,
          subreddits: redditRaw.subreddits,
          threads: redditRaw.threads.map((thread) => ({
            subreddit: thread.subreddit,
            title: thread.title,
            body: thread.body,
            score: thread.score,
            num_comments: thread.num_comments
          })),
          comments: redditRaw.comments.map((comment) => ({
            thread_title: comment.thread_title,
            body: comment.body,
            score: comment.score
          }))
        }),
        maxOutputTokens: 2600
      })
    : Promise.resolve(EMPTY_REDDIT);

  const competitorAnalysisPromise = competitorBlocks.length
    ? callStructuredModel<CompetitorAdsAnalysis>({
        schemaName: "competitor_intelligence",
        schema: competitorAdsSchema,
        systemPrompt: COMPETITOR_SYSTEM_PROMPT,
        userPrompt: buildCompetitorUserPrompt({
          seedQuery: payload.seedQuery,
          marketType: payload.marketType,
          competitorBlocks
        }),
        maxOutputTokens: 2200
      })
    : Promise.resolve(EMPTY_COMPETITOR);

  const landingAnalysisPromise = landingSources.length
    ? Promise.all(
        landingSources.map(async (page) => {
          const analysis = await callStructuredModel<Omit<LandingPageAnalysis, "url">>({
            schemaName: "landing_page_intelligence",
            schema: landingPageSchema,
            systemPrompt: LANDING_PAGE_SYSTEM_PROMPT,
            userPrompt: buildLandingPageUserPrompt({
              seedQuery: payload.seedQuery,
              marketType: payload.marketType,
              url: page.url,
              title: page.title,
              h1s: page.h1s,
              h2s: page.h2s,
              buttons: page.buttons,
              text: page.text
            }),
            maxOutputTokens: 2200
          });

          return {
            url: page.url,
            ...analysis
          };
        })
      )
    : Promise.resolve([]);

  const reviewsAnalysisPromise = reviews.length
    ? callStructuredModel<ReviewsAnalysis>({
        schemaName: "reviews_intelligence",
        schema: reviewsAnalysisSchema,
        systemPrompt: REVIEWS_SYSTEM_PROMPT,
        userPrompt: buildReviewsUserPrompt({
          seedQuery: payload.seedQuery,
          marketType: payload.marketType,
          reviews
        }),
        maxOutputTokens: 2200
      })
    : Promise.resolve(EMPTY_REVIEWS);

  const [googleAnalysis, redditAnalysis, competitorAnalysis, landingAnalysis, reviewsAnalysis] =
    await Promise.all([
      settleStep("Google analysis", warnings, () => googleAnalysisPromise),
      settleStep("Reddit analysis", warnings, () => redditAnalysisPromise),
      settleStep("Competitor analysis", warnings, () => competitorAnalysisPromise),
      settleStep("Landing page analysis", warnings, () => landingAnalysisPromise),
      settleStep("Reviews analysis", warnings, () => reviewsAnalysisPromise)
    ]);

  const finalReport = await callStructuredModel<FinalReport>({
    schemaName: "market_intelligence_report",
    schema: finalReportSchema,
    systemPrompt: FINAL_SYNTHESIS_SYSTEM_PROMPT,
    userPrompt: buildFinalSynthesisUserPrompt({
      seedQuery: payload.seedQuery,
      marketType: payload.marketType,
      googleIntel: googleAnalysis ?? EMPTY_GOOGLE,
      redditIntel: redditAnalysis ?? EMPTY_REDDIT,
      competitorIntel: competitorAnalysis ?? EMPTY_COMPETITOR,
      landingIntel: landingAnalysis ?? [],
      reviewsIntel: reviewsAnalysis ?? EMPTY_REVIEWS
    }),
    model: process.env.OPENAI_SYNTHESIS_MODEL ?? "gpt-5",
    maxOutputTokens: 4200
  });

  return finalizeReport(finalReport, payload, warnings, sourceCounts, modulesRun);
}

import type {
  CompetitorAdsAnalysis,
  GoogleDemandAnalysis,
  LandingPageAnalysis,
  ReviewsAnalysis,
  RedditVoiceAnalysis
} from "@/types/report";
import type { MarketType, ReviewInput } from "@/types/intake";

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export const GOOGLE_SYSTEM_PROMPT = `You are a senior market intelligence strategist and semantic search analyst.

Your job is to analyze search demand signals and structure them into useful marketing intelligence.

You will receive:
1. A seed query
2. Google autocomplete suggestions
3. People Also Ask questions
4. Related searches
5. Organic result snippets for extra context

Your responsibilities:
- Identify exact typed-in problems
- Label autocomplete items as real demand variations
- Label People Also Ask questions as hidden objections, deeper problem layers, decision friction, or downstream concerns
- Label related searches as free keyword expansions
- Group findings into problem clusters
- Preserve exact wording
- Detect repeated patterns
- Avoid fluff, commentary, and broad summaries
- Do not rewrite user language into polished marketing language at this stage
- Return data that matches the provided JSON schema exactly.`;

export function buildGoogleUserPrompt({
  seedQuery,
  marketType,
  autocomplete,
  peopleAlsoAsk,
  relatedSearches,
  organicSnippets
}: {
  seedQuery: string;
  marketType: MarketType;
  autocomplete: string[];
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  organicSnippets: Array<{ title: string; snippet: string; link: string }>;
}) {
  return `Seed Query: ${seedQuery}
Market Context: ${marketType || "Not specified"}
Autocomplete Suggestions:
${serialize(autocomplete)}

People Also Ask:
${serialize(peopleAlsoAsk)}

Related Searches:
${serialize(relatedSearches)}

Organic Snippets:
${serialize(organicSnippets)}`;
}

export const REDDIT_SYSTEM_PROMPT = `You are a market researcher specializing in customer voice extraction.

You will receive Reddit post titles, bodies, and comment text related to a seed query.

Your job is to extract:
- emotional language
- exact frustration phrases
- repeated complaints
- specific blockers
- objections
- recurring themes

Rules:
- Preserve exact phrases when useful
- Prefer direct quotes over summaries
- Do not sanitize the language
- Do not rewrite into polished copy
- Ignore off-topic chatter
- Prioritize posts and comments with high engagement
- Return data that matches the provided JSON schema exactly.`;

export function buildRedditUserPrompt({
  seedQuery,
  marketType,
  subreddits,
  threads,
  comments
}: {
  seedQuery: string;
  marketType: MarketType;
  subreddits: string[];
  threads: Array<{
    subreddit: string;
    title: string;
    body: string;
    score: number;
    num_comments: number;
  }>;
  comments: Array<{
    thread_title: string;
    body: string;
    score: number;
  }>;
}) {
  return `Seed Query: ${seedQuery}
Market Context: ${marketType || "Not specified"}
Subreddits Searched: ${serialize(subreddits)}
Threads:
${serialize(threads)}

Comments:
${serialize(comments)}`;
}

export const COMPETITOR_SYSTEM_PROMPT = `You are a performance marketing strategist analyzing competitor messaging.

You will receive a set of ad-like or landing-page-like copy blocks from competitors derived from search results and manual competitor inputs.

Your job is to identify:
- the pain each competitor leads with
- the promise being made
- the CTA being used
- the primary strategic angle
- recurring hook patterns
- evidence of what may already be converting

Rules:
- Stay close to what is actually present in the source copy
- Do not invent claims not shown
- Keep hooks concise
- Return data that matches the provided JSON schema exactly.`;

export function buildCompetitorUserPrompt({
  seedQuery,
  marketType,
  competitorBlocks
}: {
  seedQuery: string;
  marketType: MarketType;
  competitorBlocks: Array<{
    competitor: string;
    title: string;
    snippet: string;
    link: string;
  }>;
}) {
  return `Seed Query: ${seedQuery}
Market Context: ${marketType || "Not specified"}
Competitor Messaging Blocks:
${serialize(competitorBlocks)}`;
}

export const LANDING_PAGE_SYSTEM_PROMPT = `You are a conversion strategist analyzing landing pages.

You will receive extracted landing page text and page sections.

Your job is to identify:
- above-the-fold structure
- headline pattern
- subheadline logic
- CTA strategy
- proof elements
- benefit framing
- framework positioning
- urgency devices
- guarantee language

Rules:
- Base your answer only on the content provided
- Do not hallucinate missing sections
- Return data that matches the provided JSON schema exactly.`;

export function buildLandingPageUserPrompt({
  seedQuery,
  marketType,
  url,
  title,
  h1s,
  h2s,
  buttons,
  text
}: {
  seedQuery: string;
  marketType: MarketType;
  url: string;
  title: string;
  h1s: string[];
  h2s: string[];
  buttons: string[];
  text: string;
}) {
  return `Seed Query: ${seedQuery}
Market Context: ${marketType || "Not specified"}
Landing Page URL: ${url}
Page Title: ${title}
H1s: ${serialize(h1s)}
H2s: ${serialize(h2s)}
Buttons / CTAs: ${serialize(buttons)}
Page Text:
${text}`;
}

export const REVIEWS_SYSTEM_PROMPT = `You are a customer insight analyst.

You will receive positive and negative reviews from review platforms.

Your job is to extract:
- why people buy
- why people do not buy
- what triggers trust
- what creates resistance
- common pains
- common objections

Rules:
- Distinguish between 5-star triggers and 1-3 star objections
- Preserve exact phrases where useful
- Return data that matches the provided JSON schema exactly.`;

export function buildReviewsUserPrompt({
  seedQuery,
  marketType,
  reviews
}: {
  seedQuery: string;
  marketType: MarketType;
  reviews: ReviewInput[];
}) {
  const positive = reviews.filter((review) => review.rating >= 5);
  const negative = reviews.filter((review) => review.rating <= 3);

  return `Seed Query: ${seedQuery}
Market Context: ${marketType || "Not specified"}
Review Sources: ${serialize(Array.from(new Set(reviews.map((review) => review.source))))}
Positive Reviews:
${serialize(positive)}

Negative Reviews:
${serialize(negative)}`;
}

export const FINAL_SYNTHESIS_SYSTEM_PROMPT = `You are a senior growth strategist, conversion expert, and market intelligence operator.

You will receive structured outputs from:
- Google demand analysis
- Reddit voice-of-customer analysis
- Competitor messaging analysis
- Landing page analysis
- Reviews analysis

Your job is to synthesize all findings into an operator-grade strategic report.

You must:
- identify the core market problems
- cluster keywords by problem and intent
- identify emotional language that can be used in messaging
- identify competitor positioning patterns
- identify messaging gaps and strategic whitespace
- recommend suggested messaging that resonates
- recommend keywords likely to convert
- recommend funnel angles with evidence behind them
- recommend strategic direction

Rules:
- Be specific
- Be practical
- No fluff
- No generic marketing advice
- Tie recommendations back to evidence
- Treat missing modules as missing data, not negative proof
- Return data that matches the provided JSON schema exactly.`;

export function buildFinalSynthesisUserPrompt({
  seedQuery,
  marketType,
  googleIntel,
  redditIntel,
  competitorIntel,
  landingIntel,
  reviewsIntel
}: {
  seedQuery: string;
  marketType: MarketType;
  googleIntel: GoogleDemandAnalysis;
  redditIntel: RedditVoiceAnalysis;
  competitorIntel: CompetitorAdsAnalysis;
  landingIntel: LandingPageAnalysis[];
  reviewsIntel: ReviewsAnalysis;
}) {
  return `Seed Query: ${seedQuery}
Market Context: ${marketType || "Not specified"}

Google Intelligence:
${serialize(googleIntel)}

Reddit Intelligence:
${serialize(redditIntel)}

Competitor Intelligence:
${serialize(competitorIntel)}

Landing Page Intelligence:
${serialize(landingIntel)}

Review Intelligence:
${serialize(reviewsIntel)}`;
}

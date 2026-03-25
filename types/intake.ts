export type MarketType = "service" | "saas" | "ecommerce" | "product" | "other";

export type ReviewSource = "trustpilot" | "google" | "amazon" | "other";

export type ReviewInput = {
  source: ReviewSource;
  rating: number;
  title?: string;
  body: string;
};

export type AnalyzePayload = {
  seedQuery: string;
  competitors: string[];
  landingPageUrls: string[];
  subreddits: string[];
  marketType: MarketType;
  reviews: ReviewInput[];
};


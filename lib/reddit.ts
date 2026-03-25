import { compactUnique } from "@/lib/utils";

type RedditThread = {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  score: number;
  num_comments: number;
  permalink: string;
};

type RedditComment = {
  thread_id: string;
  thread_title: string;
  body: string;
  score: number;
};

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "market-intelligence-engine/1.0"
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`Reddit request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchRedditThreads(query: string, subreddit?: string) {
  const base = subreddit
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : "https://www.reddit.com/search.json";

  const url = new URL(base);
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "top");
  url.searchParams.set("t", "year");
  url.searchParams.set("limit", "8");
  url.searchParams.set("restrict_sr", subreddit ? "1" : "0");

  return fetchJson(url.toString());
}

export async function fetchHotSubredditPosts(subreddit: string) {
  return fetchJson(`https://www.reddit.com/r/${subreddit}/hot.json?limit=8`);
}

export async function fetchRedditThreadComments(permalink: string) {
  return fetchJson(`https://www.reddit.com${permalink}.json?limit=20`);
}

function normalizeThreads(payload: unknown): RedditThread[] {
  const children =
    (payload as {
      data?: { children?: Array<{ data?: Record<string, unknown> }> };
    })?.data?.children ?? [];

  return children
    .map((item) => item.data ?? {})
    .map((data) => ({
      id: String(data.id ?? ""),
      subreddit: String(data.subreddit ?? ""),
      title: String(data.title ?? ""),
      body: String(data.selftext ?? ""),
      score: Number(data.score ?? 0),
      num_comments: Number(data.num_comments ?? 0),
      permalink: String(data.permalink ?? "")
    }))
    .filter((thread) => thread.id && thread.title && thread.permalink);
}

function normalizeComments(
  payload: unknown,
  threadId: string,
  threadTitle: string
): RedditComment[] {
  const listing = Array.isArray(payload) ? payload[1] : null;
  const children =
    (listing as {
      data?: { children?: Array<{ kind?: string; data?: Record<string, unknown> }> };
    })?.data?.children ?? [];

  return children
    .filter((item) => item.kind === "t1")
    .map((item) => item.data ?? {})
    .map((data) => ({
      thread_id: threadId,
      thread_title: threadTitle,
      body: String(data.body ?? ""),
      score: Number(data.score ?? 0)
    }))
    .filter((comment) => comment.body);
}

export async function collectRedditCorpus(seedQuery: string, subreddits: string[]) {
  const searchedSubreddits = compactUnique(subreddits, 5);

  const searchResponses = await Promise.allSettled([
    fetchRedditThreads(seedQuery),
    ...searchedSubreddits.map((subreddit) => fetchRedditThreads(seedQuery, subreddit))
  ]);

  const hotResponses = await Promise.allSettled(
    searchedSubreddits.map((subreddit) => fetchHotSubredditPosts(subreddit))
  );

  const threadMap = new Map<string, RedditThread>();

  for (const response of [...searchResponses, ...hotResponses]) {
    if (response.status !== "fulfilled") {
      continue;
    }

    for (const thread of normalizeThreads(response.value)) {
      const existing = threadMap.get(thread.permalink);
      if (!existing || existing.score < thread.score) {
        threadMap.set(thread.permalink, thread);
      }
    }
  }

  const rankedThreads = Array.from(threadMap.values())
    .sort(
      (left, right) =>
        right.score + right.num_comments * 2 - (left.score + left.num_comments * 2)
    )
    .slice(0, 8);

  const commentsResponses = await Promise.allSettled(
    rankedThreads.map((thread) => fetchRedditThreadComments(thread.permalink))
  );

  const comments = commentsResponses
    .flatMap((response, index) => {
      if (response.status !== "fulfilled") {
        return [];
      }

      const thread = rankedThreads[index];
      return normalizeComments(response.value, thread.id, thread.title);
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 80);

  return {
    subreddits: searchedSubreddits,
    threads: rankedThreads,
    comments
  };
}


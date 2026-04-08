import { config } from "../apiConfig";
import { getCached, setCache, cacheKey } from "../cache";
import type { Review } from "@shared/schema";

let redditAccessToken: string | null = null;
let tokenExpires = 0;

async function getRedditToken(): Promise<string | null> {
  if (redditAccessToken && Date.now() < tokenExpires) return redditAccessToken;

  if (!config.REDDIT_CLIENT_ID || !config.REDDIT_CLIENT_SECRET) return null;

  try {
    const auth = Buffer.from(`${config.REDDIT_CLIENT_ID}:${config.REDDIT_CLIENT_SECRET}`).toString("base64");
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "R3viewRadar/1.0",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      console.error("Reddit auth error:", response.status);
      return null;
    }

    const data = await response.json();
    redditAccessToken = data.access_token;
    tokenExpires = Date.now() + (data.expires_in - 60) * 1000;
    return redditAccessToken;
  } catch (err) {
    console.error("Reddit auth fetch error:", err);
    return null;
  }
}

export async function searchReddit(query: string, type: "business" | "product") {
  const key = cacheKey("reddit", query, type);
  const cached = getCached<ReturnType<typeof formatResult>>(key);
  if (cached) return cached;

  const token = await getRedditToken();
  if (!token) return null;

  try {
    const searchQuery = `${query} review`;
    const subreddits = type === "business"
      ? "reviews+yelp+restaurant+food+hotels+travel"
      : "reviews+BuyItForLife+ProductReviews+gadgets+technology";

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddits}/search?${new URLSearchParams({
        q: searchQuery,
        sort: "relevance",
        t: "year",
        limit: "15",
        restrict_sr: "true",
        type: "link",
      })}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "R3viewRadar/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Reddit search error:", response.status);
      return null;
    }

    const data = await response.json();
    const posts = data.data?.children || [];

    const result = formatResult(posts, query);
    setCache(key, result);
    return result;
  } catch (err) {
    console.error("Reddit fetch error:", err);
    return null;
  }
}

function estimateRating(post: any): number {
  const title = (post.data?.title || "").toLowerCase();
  const text = (post.data?.selftext || "").toLowerCase();
  const combined = title + " " + text;
  const score = post.data?.score || 0;
  const upvoteRatio = post.data?.upvote_ratio || 0.5;

  // Sentiment heuristics
  const positiveWords = ["great", "love", "amazing", "best", "excellent", "perfect", "recommend", "fantastic", "awesome", "good"];
  const negativeWords = ["terrible", "awful", "worst", "hate", "horrible", "avoid", "bad", "disappointing", "never again", "scam", "rip off"];

  let sentiment = 3; // neutral default
  const posCount = positiveWords.filter(w => combined.includes(w)).length;
  const negCount = negativeWords.filter(w => combined.includes(w)).length;

  if (posCount > negCount) sentiment = Math.min(5, 3 + posCount);
  else if (negCount > posCount) sentiment = Math.max(1, 3 - negCount);

  // Adjust with upvote ratio
  if (upvoteRatio > 0.85 && score > 10) sentiment = Math.min(5, sentiment + 0.5);

  return Math.round(Math.min(5, Math.max(1, sentiment)));
}

function formatResult(posts: any[], query: string) {
  const reviews: Review[] = posts
    .filter((p: any) => p.data?.selftext || p.data?.title)
    .slice(0, 10)
    .map((p: any, i: number) => {
      const data = p.data;
      const rating = estimateRating(p);
      const text = data.selftext
        ? data.selftext.slice(0, 500) + (data.selftext.length > 500 ? "..." : "")
        : data.title;

      return {
        id: `reddit-${data.id || i}`,
        author: data.author || "Redditor",
        rating,
        text: text || data.title,
        date: data.created_utc
          ? new Date(data.created_utc * 1000).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        helpful: data.score || 0,
        verified: false,
        platform: "Reddit",
      };
    });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : 3.5;

  const positive = reviews.filter(r => r.rating >= 4).length;
  const neutral = reviews.filter(r => r.rating === 3).length;
  const negative = reviews.filter(r => r.rating <= 2).length;

  return {
    platform: "Reddit",
    platformIcon: "reddit",
    totalReviews,
    averageRating: avgRating,
    positiveCount: positive,
    neutralCount: neutral,
    negativeCount: negative,
    reviews: JSON.stringify(reviews),
    url: `https://www.reddit.com/search/?q=${encodeURIComponent(query + " review")}&type=link`,
    isLive: true,
  };
}

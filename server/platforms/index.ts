import { searchGooglePlaces } from "./google";
import { searchYelp } from "./yelp";
import { searchReddit } from "./reddit";
import { searchAmazon, searchTripAdvisor, searchTrustpilot } from "./serpapi";
import { generateMockData } from "../mockData";
import { isApiConfigured } from "../apiConfig";

interface PlatformResult {
  platform: string;
  platformIcon: string;
  totalReviews: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  reviews: string; // JSON
  url: string | null;
  isLive?: boolean;
}

export async function searchAllPlatforms(
  query: string,
  type: "business" | "product",
  location?: string | null
): Promise<PlatformResult[]> {
  const results: PlatformResult[] = [];
  const promises: Promise<PlatformResult | null>[] = [];

  if (type === "business") {
    // Business platforms: Google, Yelp, Reddit, TripAdvisor, Facebook
    promises.push(
      searchGooglePlaces(query, type, location).catch((e) => {
        console.error("Google error:", e);
        return null;
      })
    );

    promises.push(
      searchYelp(query, location).catch((e) => {
        console.error("Yelp error:", e);
        return null;
      })
    );

    promises.push(
      searchReddit(query, type).catch((e) => {
        console.error("Reddit error:", e);
        return null;
      })
    );

    promises.push(
      searchTripAdvisor(query).catch((e) => {
        console.error("TripAdvisor error:", e);
        return null;
      })
    );
  } else {
    // Product platforms: Amazon, Google, Reddit, Trustpilot, BestBuy
    promises.push(
      searchAmazon(query).catch((e) => {
        console.error("Amazon error:", e);
        return null;
      })
    );

    promises.push(
      searchGooglePlaces(query, type).catch((e) => {
        console.error("Google error:", e);
        return null;
      })
    );

    promises.push(
      searchReddit(query, type).catch((e) => {
        console.error("Reddit error:", e);
        return null;
      })
    );

    promises.push(
      searchTrustpilot(query).catch((e) => {
        console.error("Trustpilot error:", e);
        return null;
      })
    );
  }

  // Execute all in parallel with a 12-second timeout
  const settled = await Promise.allSettled(
    promises.map(
      (p) =>
        Promise.race([
          p,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
        ])
    )
  );

  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value);
    }
  }

  // If we got zero live results, fall back to mock data so the app still works
  if (results.length === 0) {
    console.log("No live API results, falling back to mock data for:", query);
    const mockResults = generateMockData(query, type);
    return mockResults.map((m) => ({ ...m, isLive: false }));
  }

  // For platforms that didn't return, optionally fill with mock data
  // (only if not enough platforms returned)
  if (results.length < 3) {
    const missingMock = generateMockData(query, type);
    const existingPlatforms = new Set(results.map((r) => r.platform.toLowerCase()));
    for (const mock of missingMock) {
      if (!existingPlatforms.has(mock.platform.toLowerCase()) && results.length < 5) {
        results.push({ ...mock, isLive: false });
      }
    }
  }

  return results;
}

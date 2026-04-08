import type { SearchRequest, AdapterResult, SearchResult, SentimentBreakdown, PlatformSummary } from '../types';
import type { PlatformAdapter } from '../types';
import { businessAdapters, productAdapters } from '../adapters';
import { generateMockResults } from './mockData';

const TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function computeSentiment(reviews: { rating: number }[]): SentimentBreakdown {
  if (reviews.length === 0) return { positive: 0, neutral: 0, negative: 0 };
  let pos = 0, neu = 0, neg = 0;
  for (const r of reviews) {
    if (r.rating >= 4) pos++;
    else if (r.rating >= 3) neu++;
    else neg++;
  }
  const total = reviews.length;
  return {
    positive: Math.round((pos / total) * 100),
    neutral: Math.round((neu / total) * 100),
    negative: Math.round((neg / total) * 100),
  };
}

export async function orchestrateSearch(req: SearchRequest): Promise<SearchResult> {
  const adapters: PlatformAdapter[] = req.type === 'business' ? businessAdapters : productAdapters;

  // Run all adapters in parallel with timeout
  const results = await Promise.all(
    adapters.map((adapter) =>
      adapter.isConfigured()
        ? withTimeout(adapter.search(req), TIMEOUT_MS)
        : Promise.resolve(null)
    )
  );

  let adapterResults: AdapterResult[] = results.filter((r): r is AdapterResult => r !== null);

  // If no live data, fall back to mock
  const anyConfigured = adapters.some((a) => a.isConfigured());
  if (adapterResults.length === 0) {
    adapterResults = generateMockResults(req.query, req.type);
  } else if (!anyConfigured) {
    adapterResults = generateMockResults(req.query, req.type);
  }

  // Aggregate
  const allReviews = adapterResults.flatMap((r) => r.reviews);
  const totalReviews = adapterResults.reduce((s, r) => s + r.reviewCount, 0);
  const overallRating = adapterResults.length > 0
    ? Math.round((adapterResults.reduce((s, r) => s + r.rating * r.reviewCount, 0) / totalReviews) * 10) / 10
    : 0;

  const platforms: PlatformSummary[] = adapterResults.map((r) => ({
    platform: r.platform,
    icon: r.icon,
    rating: Math.round(r.rating * 10) / 10,
    reviewCount: r.reviewCount,
    url: r.url,
  }));

  const bestPlatform = platforms.reduce((best, p) => (p.rating > best.rating ? p : best), platforms[0]);
  const sentiment = computeSentiment(allReviews);

  // Sort reviews by date (newest first)
  allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    query: req.query,
    type: req.type,
    category: req.category || 'all',
    location: req.location,
    overallRating,
    totalReviews,
    sentiment,
    platforms,
    reviews: allReviews,
    bestPlatform,
  };
}

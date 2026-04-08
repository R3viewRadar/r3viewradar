import type { AdapterResult, Review } from '../types';

// Deterministic hash for consistent mock data per query
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const firstNames = [
  'Sarah M.', 'James K.', 'Maria G.', 'David L.', 'Emily R.',
  'Michael C.', 'Jessica T.', 'Robert W.', 'Amanda P.', 'Chris B.',
  'Jennifer H.', 'Daniel F.', 'Lisa N.', 'Kevin S.', 'Rachel A.',
  'Thomas D.', 'Michelle E.', 'Andrew J.', 'Stephanie V.', 'Brian Z.',
];

const positiveSnippets = [
  'Absolutely fantastic experience. The quality exceeded my expectations in every way.',
  'Best in the area, hands down. Have been coming here for years and it never disappoints.',
  'Outstanding service and attention to detail. Highly recommend to anyone looking.',
  'Great value for the price. Will definitely come back and bring friends next time.',
  'Exceeded all my expectations. The team here clearly cares about what they do.',
  'Top-notch quality. I have tried many alternatives and this is by far the best.',
  'Wonderful experience from start to finish. Every detail was carefully considered.',
  'Cannot say enough good things. This has quickly become my go-to recommendation.',
];

const neutralSnippets = [
  'Decent overall. There are a few things they could improve but nothing major.',
  'Average experience. Met expectations but did not particularly stand out.',
  'Solid choice for the price range. Nothing spectacular but gets the job done.',
  'Pretty good but I have seen better. Would still consider recommending it.',
  'Okay experience. Some aspects were great while others fell a bit flat.',
];

const negativeSnippets = [
  'Disappointing experience. Did not live up to the hype or the positive reviews.',
  'Below average. Several issues that need to be addressed by management.',
  'Would not recommend. Had multiple problems and customer service was unhelpful.',
  'Not worth the price. There are much better alternatives available nearby.',
];

function generateMockReviews(query: string, platform: string, icon: string, count: number): Review[] {
  const h = hashCode(query + platform);
  const reviews: Review[] = [];

  for (let i = 0; i < count; i++) {
    const seed = (h + i * 7) % 100;
    let rating: number;
    let text: string;

    if (seed < 55) {
      rating = seed < 30 ? 5 : 4;
      text = positiveSnippets[(h + i) % positiveSnippets.length];
    } else if (seed < 80) {
      rating = 3;
      text = neutralSnippets[(h + i) % neutralSnippets.length];
    } else {
      rating = seed < 92 ? 2 : 1;
      text = negativeSnippets[(h + i) % negativeSnippets.length];
    }

    const daysAgo = ((h + i * 13) % 365) + 1;
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString();

    reviews.push({
      id: `${platform.toLowerCase()}-mock-${i}`,
      platform,
      platformIcon: icon,
      author: firstNames[(h + i) % firstNames.length],
      rating,
      date,
      text: `${text} (Searched: "${query}")`,
      verified: seed % 3 === 0,
      helpful: (h + i * 3) % 50,
    });
  }

  return reviews;
}

interface MockPlatform {
  name: string;
  icon: string;
  url: (q: string) => string;
}

const businessPlatforms: MockPlatform[] = [
  { name: 'Google', icon: '🔍', url: (q) => `https://maps.google.com/?q=${encodeURIComponent(q)}` },
  { name: 'Yelp', icon: '⭐', url: (q) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}` },
  { name: 'TripAdvisor', icon: '🌍', url: (q) => `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q)}` },
  { name: 'Reddit', icon: '💬', url: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}` },
];

const productPlatforms: MockPlatform[] = [
  { name: 'Amazon', icon: '📦', url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { name: 'Google', icon: '🔍', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}+reviews` },
  { name: 'Trustpilot', icon: '✅', url: (q) => `https://www.trustpilot.com/search?query=${encodeURIComponent(q)}` },
  { name: 'Reddit', icon: '💬', url: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}` },
];

export function generateMockResults(
  query: string,
  type: 'business' | 'product'
): AdapterResult[] {
  const platforms = type === 'business' ? businessPlatforms : productPlatforms;
  const h = hashCode(query);

  return platforms.map((p, idx) => {
    const reviewCount = 8 + ((h + idx * 5) % 8);
    const reviews = generateMockReviews(query, p.name, p.icon, reviewCount);
    const avgRating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

    return {
      platform: p.name,
      icon: p.icon,
      rating: Math.max(1, Math.min(5, avgRating + ((h + idx) % 3 - 1) * 0.2)),
      reviewCount: 50 + ((h + idx * 17) % 500),
      url: p.url(query),
      reviews,
    };
  });
}

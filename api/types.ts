export interface Review {
  id: string;
  platform: string;
  platformIcon: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  helpful?: number;
}

export interface PlatformSummary {
  platform: string;
  icon: string;
  rating: number;
  reviewCount: number;
  url: string;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SearchResult {
  query: string;
  type: 'business' | 'product';
  category: string;
  location?: string;
  overallRating: number;
  totalReviews: number;
  sentiment: SentimentBreakdown;
  platforms: PlatformSummary[];
  reviews: Review[];
  bestPlatform: PlatformSummary;
}

export interface SearchRequest {
  query: string;
  type: 'business' | 'product';
  category?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

export interface AdapterResult {
  platform: string;
  icon: string;
  rating: number;
  reviewCount: number;
  url: string;
  reviews: Review[];
}

export interface PlatformAdapter {
  name: string;
  icon: string;
  isConfigured: () => boolean;
  search: (req: SearchRequest) => Promise<AdapterResult | null>;
}

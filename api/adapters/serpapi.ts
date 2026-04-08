import axios from 'axios';
import type { PlatformAdapter, SearchRequest, AdapterResult, Review } from '../types';

const API_KEY = process.env.SERPAPI_KEY;

function createSerpAdapter(
  platformName: string,
  icon: string,
  engine: string,
  buildParams: (query: string) => Record<string, string>
): PlatformAdapter {
  return {
    name: platformName,
    icon,
    isConfigured: () => !!API_KEY,

    search: async (req: SearchRequest): Promise<AdapterResult | null> => {
      if (!API_KEY) return null;

      try {
        const params: any = {
          api_key: API_KEY,
          engine,
          ...buildParams(req.query),
        };

        const res = await axios.get('https://serpapi.com/search.json', {
          params,
          timeout: 12000,
        });

        const data = res.data;
        let reviews: Review[] = [];
        let rating = 0;
        let reviewCount = 0;
        let url = '';

        if (engine === 'google_product') {
          // Amazon / product reviews via Google Shopping
          const product = data.product_results || {};
          rating = product.rating || 0;
          reviewCount = product.reviews || 0;
          url = product.link || `https://www.amazon.com/s?k=${encodeURIComponent(req.query)}`;
          reviews = (data.reviews_results?.reviews || []).slice(0, 10).map((r: any, i: number) => ({
            id: `${platformName.toLowerCase()}-${i}`,
            platform: platformName,
            platformIcon: icon,
            author: r.author || `${platformName} User`,
            rating: r.rating || 0,
            date: r.date || new Date().toISOString(),
            text: r.content || r.snippet || '',
            verified: r.verified_purchase || false,
            helpful: r.helpful_votes || 0,
          }));
        } else {
          // TripAdvisor or Trustpilot via Google search
          const results = data.organic_results || [];
          url = results[0]?.link || '';
          reviews = results.slice(0, 8).map((r: any, i: number) => ({
            id: `${platformName.toLowerCase()}-${i}`,
            platform: platformName,
            platformIcon: icon,
            author: `${platformName} User`,
            rating: r.rich_snippet?.top?.detected_extensions?.rating || 4,
            date: r.date || new Date().toISOString(),
            text: r.snippet || '',
            verified: false,
            helpful: 0,
          }));
          rating = reviews.length > 0
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
            : 0;
          reviewCount = reviews.length;
        }

        if (reviews.length === 0) return null;

        return { platform: platformName, icon, rating, reviewCount, url, reviews };
      } catch (err) {
        console.error(`${platformName} adapter error:`, err);
        return null;
      }
    },
  };
}

export const amazonAdapter = createSerpAdapter(
  'Amazon', '📦', 'google_product',
  (q) => ({ q, gl: 'us', hl: 'en' })
);

export const tripadvisorAdapter = createSerpAdapter(
  'TripAdvisor', '🌍', 'google',
  (q) => ({ q: `${q} reviews site:tripadvisor.com`, gl: 'us', hl: 'en' })
);

export const trustpilotAdapter = createSerpAdapter(
  'Trustpilot', '✅', 'google',
  (q) => ({ q: `${q} reviews site:trustpilot.com`, gl: 'us', hl: 'en' })
);

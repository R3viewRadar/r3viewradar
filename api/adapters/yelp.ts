import axios from 'axios';
import type { PlatformAdapter, SearchRequest, AdapterResult, Review } from '../types';

const API_KEY = process.env.YELP_API_KEY;

export const yelpAdapter: PlatformAdapter = {
  name: 'Yelp',
  icon: '⭐',

  isConfigured: () => !!API_KEY,

  search: async (req: SearchRequest): Promise<AdapterResult | null> => {
    if (!API_KEY) return null;

    try {
      const params: any = { term: req.query, limit: 1, sort_by: 'best_match' };
      if (req.lat && req.lng) {
        params.latitude = req.lat;
        params.longitude = req.lng;
      } else if (req.location) {
        params.location = req.location;
      } else {
        params.location = 'United States';
      }

      const searchRes = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params,
        timeout: 10000,
      });

      const biz = searchRes.data.businesses?.[0];
      if (!biz) return null;

      // Fetch reviews for this business
      const reviewRes = await axios.get(
        `https://api.yelp.com/v3/businesses/${biz.id}/reviews`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
          params: { limit: 10, sort_by: 'yelp_sort' },
          timeout: 10000,
        }
      );

      const reviews: Review[] = (reviewRes.data.reviews || []).map((r: any, i: number) => ({
        id: `yelp-${i}`,
        platform: 'Yelp',
        platformIcon: '⭐',
        author: r.user?.name || 'Yelp User',
        rating: r.rating || 0,
        date: r.time_created || new Date().toISOString(),
        text: r.text || '',
        verified: false,
        helpful: 0,
      }));

      return {
        platform: 'Yelp',
        icon: '⭐',
        rating: biz.rating || 0,
        reviewCount: biz.review_count || reviews.length,
        url: biz.url || `https://www.yelp.com/search?find_desc=${encodeURIComponent(req.query)}`,
        reviews,
      };
    } catch (err) {
      console.error('Yelp adapter error:', err);
      return null;
    }
  },
};

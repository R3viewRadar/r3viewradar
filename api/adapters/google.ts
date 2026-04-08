import axios from 'axios';
import type { PlatformAdapter, SearchRequest, AdapterResult, Review } from '../types';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const googleAdapter: PlatformAdapter = {
  name: 'Google',
  icon: '🔍',

  isConfigured: () => !!API_KEY,

  search: async (req: SearchRequest): Promise<AdapterResult | null> => {
    if (!API_KEY) return null;

    try {
      let textQuery = req.query;
      if (req.location) textQuery += ` near ${req.location}`;

      const searchBody: any = {
        textQuery,
        languageCode: 'en',
      };

      if (req.lat && req.lng) {
        searchBody.locationBias = {
          circle: {
            center: { latitude: req.lat, longitude: req.lng },
            radius: 20000,
          },
        };
      }

      const searchRes = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        searchBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri',
          },
          timeout: 10000,
        }
      );

      const place = searchRes.data.places?.[0];
      if (!place) return null;

      const reviews: Review[] = (place.reviews || []).slice(0, 10).map((r: any, i: number) => ({
        id: `google-${i}`,
        platform: 'Google',
        platformIcon: '🔍',
        author: r.authorAttribution?.displayName || 'Google User',
        rating: r.rating || 0,
        date: r.publishTime || new Date().toISOString(),
        text: r.text?.text || '',
        verified: true,
        helpful: r.thumbsUpCount || 0,
      }));

      return {
        platform: 'Google',
        icon: '🔍',
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || reviews.length,
        url: place.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(req.query)}`,
        reviews,
      };
    } catch (err) {
      console.error('Google adapter error:', err);
      return null;
    }
  },
};

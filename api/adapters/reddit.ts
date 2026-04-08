import axios from 'axios';
import type { PlatformAdapter, SearchRequest, AdapterResult, Review } from '../types';

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  try {
    const res = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'R3viewRadar/1.0' },
        timeout: 8000,
      }
    );
    cachedToken = { token: res.data.access_token, expiresAt: Date.now() + (res.data.expires_in - 60) * 1000 };
    return cachedToken.token;
  } catch {
    return null;
  }
}

export const redditAdapter: PlatformAdapter = {
  name: 'Reddit',
  icon: '💬',

  isConfigured: () => !!(CLIENT_ID && CLIENT_SECRET),

  search: async (req: SearchRequest): Promise<AdapterResult | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
      const searchQuery = `${req.query} review`;
      const res = await axios.get('https://oauth.reddit.com/search', {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'R3viewRadar/1.0' },
        params: { q: searchQuery, sort: 'relevance', limit: 15, type: 'link' },
        timeout: 10000,
      });

      const posts = res.data?.data?.children || [];
      if (posts.length === 0) return null;

      const reviews: Review[] = posts.slice(0, 10).map((p: any, i: number) => {
        const d = p.data;
        const score = d.upvote_ratio || 0.5;
        const rating = Math.round(score * 5 * 10) / 10;
        return {
          id: `reddit-${i}`,
          platform: 'Reddit',
          platformIcon: '💬',
          author: `u/${d.author || 'anonymous'}`,
          rating: Math.min(5, Math.max(1, rating)),
          date: new Date((d.created_utc || 0) * 1000).toISOString(),
          text: d.title + (d.selftext ? `\n\n${d.selftext.slice(0, 500)}` : ''),
          verified: false,
          helpful: d.score || 0,
        };
      });

      const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

      return {
        platform: 'Reddit',
        icon: '💬',
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        url: `https://www.reddit.com/search/?q=${encodeURIComponent(req.query + ' review')}`,
        reviews,
      };
    } catch (err) {
      console.error('Reddit adapter error:', err);
      return null;
    }
  },
};

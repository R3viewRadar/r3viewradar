import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orchestrateSearch } from './utils/orchestrator';
import type { SearchRequest } from './types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { query, type, category, location, lat, lng } = req.method === 'POST' ? req.body : req.query;

    if (!query || !type) {
      return res.status(400).json({ error: 'Missing required fields: query, type' });
    }

    const searchReq: SearchRequest = {
      query: String(query),
      type: type as 'business' | 'product',
      category: category ? String(category) : undefined,
      location: location ? String(location) : undefined,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    };

    const result = await orchestrateSearch(searchReq);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Search API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

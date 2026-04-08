// Local dev server — not used in Vercel deployment (Vercel uses serverless functions)
import express from 'express';
import cors from 'cors';
import { orchestrateSearch } from './utils/orchestrator';
import { allAdapters } from './adapters';
import type { SearchRequest } from './types';

const app = express();
app.use(cors());
app.use(express.json());

app.all('/api/search', async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    const { query, type, category, location, lat, lng } = data;

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
    return res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/status', (_req, res) => {
  const status = allAdapters.map((a) => ({
    platform: a.name,
    icon: a.icon,
    configured: a.isConfigured(),
    status: a.isConfigured() ? 'live' : 'simulated',
  }));
  res.json({ platforms: status });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`R3viewRadar API running on http://localhost:${PORT}`);
});

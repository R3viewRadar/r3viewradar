import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allAdapters } from './adapters';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const status = allAdapters.map((a) => ({
    platform: a.name,
    icon: a.icon,
    configured: a.isConfigured(),
    status: a.isConfigured() ? 'live' : 'simulated',
  }));

  return res.status(200).json({ platforms: status });
}

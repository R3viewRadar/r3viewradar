// Simple in-memory cache with TTL for API responses
// Prevents hammering external APIs for the same query

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, { data, expires: Date.now() + ttl });

  // Evict old entries periodically
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expires) cache.delete(k);
    }
  }
}

export function cacheKey(platform: string, query: string, type: string): string {
  return `${platform}:${type}:${query.toLowerCase().trim()}`;
}

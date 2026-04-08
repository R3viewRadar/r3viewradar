import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { searchAllPlatforms } from "./platforms/index";
import { generateMockData } from "./mockData";
import { insertSearchSchema } from "@shared/schema";
import { getApiStatus } from "./apiConfig";
import type { SearchResultData, Review, SourceLink } from "@shared/schema";

export function registerRoutes(httpServer: Server, app: Express) {
  // POST /api/search — perform a new search
  app.post("/api/search", async (req, res) => {
    try {
      const body = insertSearchSchema.safeParse({
        ...req.body,
        timestamp: new Date().toISOString(),
      });

      if (!body.success) {
        return res.status(400).json({ error: "Invalid request", details: body.error.issues });
      }

      const search = storage.createSearch(body.data);
      const searchType = body.data.type as "business" | "product";
      const location = body.data.location || null;

      // Fetch from all live platforms in parallel
      const platformData = await searchAllPlatforms(body.data.query, searchType, location);

      const platformResults = platformData.map((platform) =>
        storage.createReviewResult({
          ...platform,
          searchId: search.id,
          url: platform.url || null,
        })
      );

      // Build aggregated result
      const allReviews: Review[] = platformResults
        .flatMap((p) => {
          try {
            return JSON.parse(p.reviews) as Review[];
          } catch {
            return [];
          }
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalReviews = platformResults.reduce((sum, p) => sum + p.totalReviews, 0);
      const weightedRating =
        totalReviews > 0
          ? platformResults.reduce((sum, p) => sum + p.averageRating * p.totalReviews, 0) / totalReviews
          : 0;
      const positive = platformResults.reduce((sum, p) => sum + p.positiveCount, 0);
      const neutral = platformResults.reduce((sum, p) => sum + p.neutralCount, 0);
      const negative = platformResults.reduce((sum, p) => sum + p.negativeCount, 0);

      // Generate source links
      const sourceLinks: SourceLink[] = platformResults.map((p) => ({
        platform: p.platform,
        platformIcon: p.platformIcon,
        url: p.url || `https://www.google.com/search?q=${encodeURIComponent(body.data.query + " " + p.platform + " reviews")}`,
        title: `${body.data.query} on ${p.platform}`,
        description: generateSourceDescription(p.platform, body.data.query),
      }));

      const result: SearchResultData = {
        search,
        platforms: platformResults,
        overallRating: Math.round(weightedRating * 10) / 10,
        totalReviews,
        sentimentBreakdown: { positive, neutral, negative },
        allReviews: allReviews.slice(0, 50),
        sourceLinks,
      };

      storage.deleteOldSearches();
      return res.json(result);
    } catch (err) {
      console.error("Search error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/search/:id — get a specific search result
  app.get("/api/search/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const search = storage.getSearch(id);
    if (!search) return res.status(404).json({ error: "Search not found" });

    const platforms = storage.getReviewResultsBySearchId(id);
    const allReviews: Review[] = platforms
      .flatMap((p) => {
        try {
          return JSON.parse(p.reviews) as Review[];
        } catch {
          return [];
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalReviews = platforms.reduce((sum, p) => sum + p.totalReviews, 0);
    const weightedRating =
      totalReviews > 0
        ? platforms.reduce((sum, p) => sum + p.averageRating * p.totalReviews, 0) / totalReviews
        : 0;

    const sourceLinks: SourceLink[] = platforms.map((p) => ({
      platform: p.platform,
      platformIcon: p.platformIcon,
      url: p.url || `https://www.google.com/search?q=${encodeURIComponent(search.query + " " + p.platform + " reviews")}`,
      title: `${search.query} on ${p.platform}`,
      description: generateSourceDescription(p.platform, search.query),
    }));

    const result: SearchResultData = {
      search,
      platforms,
      overallRating: Math.round(weightedRating * 10) / 10,
      totalReviews,
      sentimentBreakdown: {
        positive: platforms.reduce((sum, p) => sum + p.positiveCount, 0),
        neutral: platforms.reduce((sum, p) => sum + p.neutralCount, 0),
        negative: platforms.reduce((sum, p) => sum + p.negativeCount, 0),
      },
      allReviews: allReviews.slice(0, 50),
      sourceLinks,
    };

    return res.json(result);
  });

  // GET /api/recent — recent searches
  app.get("/api/recent", (req, res) => {
    const recent = storage.getRecentSearches();
    return res.json(recent);
  });

  // GET /api/status — check which APIs are configured
  app.get("/api/status", (req, res) => {
    return res.json(getApiStatus());
  });
}

function generateSourceDescription(platform: string, query: string): string {
  const map: Record<string, string> = {
    Google: `See ratings, photos, hours, and directions for ${query} on Google Maps.`,
    Yelp: `Read community reviews, check menus, and find contact info on Yelp.`,
    TripAdvisor: `Traveler reviews, rankings, and photos for ${query}.`,
    Facebook: `Community page with posts, recommendations, and check-ins.`,
    Reddit: `Community discussions, honest opinions, and user experiences.`,
    Amazon: `Product listings with verified purchase reviews and ratings.`,
    Trustpilot: `Consumer trust ratings and detailed customer experiences.`,
    "Best Buy": `Expert and customer reviews for electronics and tech products.`,
  };
  return map[platform] || `Reviews and ratings for ${query} on ${platform}.`;
}

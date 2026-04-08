import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { searchAllPlatforms } from "./platforms/index";
import { generateMockData } from "./mockData";
import { insertSearchSchema } from "@shared/schema";
import { getApiStatus } from "./apiConfig";
import type { SearchResultData, Review, SourceLink, ContactInfo } from "@shared/schema";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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

      const contactInfo = generateContactInfo(body.data.query, searchType, location);

      const result: SearchResultData = {
        search,
        platforms: platformResults,
        overallRating: Math.round(weightedRating * 10) / 10,
        totalReviews,
        sentimentBreakdown: { positive, neutral, negative },
        allReviews: allReviews.slice(0, 50),
        sourceLinks,
        contactInfo,
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

    const contactInfo = generateContactInfo(search.query, search.type as "business" | "product", search.location);

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
      contactInfo,
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

  // ---- AUTH ROUTES ----

  // POST /api/auth/signup
  app.post("/api/auth/signup", (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
      }

      const existing = storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const passwordHash = hashPassword(password);
      const user = storage.createUser({
        username,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });

      return res.json({ user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
      }

      const user = storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const passwordHash = hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      return res.json({ user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/auth/user/:id
  app.get("/api/auth/user/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const user = storage.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ id: user.id, username: user.username, email: user.email, createdAt: user.createdAt });
  });

  // ---- FAVORITES ROUTES ----

  // GET /api/favorites/:userId
  app.get("/api/favorites/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });
    const favs = storage.getFavoritesByUserId(userId);
    return res.json(favs);
  });

  // POST /api/favorites
  app.post("/api/favorites", (req, res) => {
    try {
      const { userId, query, type, location, note } = req.body;
      if (!userId || !query || !type) {
        return res.status(400).json({ error: "userId, query, and type are required" });
      }
      const fav = storage.createFavorite({
        userId,
        query,
        type,
        location: location || null,
        note: note || null,
        createdAt: new Date().toISOString(),
      });
      return res.json(fav);
    } catch (err) {
      console.error("Create favorite error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/favorites/:id
  app.delete("/api/favorites/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    storage.deleteFavorite(id);
    return res.json({ success: true });
  });

  // ---- ALERTS ROUTES ----

  // GET /api/alerts/:userId
  app.get("/api/alerts/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });
    const userAlerts = storage.getAlertsByUserId(userId);
    return res.json(userAlerts);
  });

  // POST /api/alerts
  app.post("/api/alerts", (req, res) => {
    try {
      const { userId, query, type, location } = req.body;
      if (!userId || !query || !type) {
        return res.status(400).json({ error: "userId, query, and type are required" });
      }
      const alert = storage.createAlert({
        userId,
        query,
        type,
        location: location || null,
        active: 1,
        lastChecked: null,
        createdAt: new Date().toISOString(),
      });
      return res.json(alert);
    } catch (err) {
      console.error("Create alert error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/alerts/:id/toggle
  app.patch("/api/alerts/:id/toggle", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const alert = storage.toggleAlert(id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    return res.json(alert);
  });

  // DELETE /api/alerts/:id
  app.delete("/api/alerts/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    storage.deleteAlert(id);
    return res.json({ success: true });
  });

  // ---- COMPARE ROUTE ----

  // POST /api/compare
  app.post("/api/compare", async (req, res) => {
    try {
      const { queryA, queryB, type, userId } = req.body;
      if (!queryA || !queryB || !type) {
        return res.status(400).json({ error: "queryA, queryB, and type are required" });
      }

      // Run both searches in parallel
      const [platformsA, platformsB] = await Promise.all([
        searchAllPlatforms(queryA, type as "business" | "product", null),
        searchAllPlatforms(queryB, type as "business" | "product", null),
      ]);

      const buildResult = (query: string, platforms: typeof platformsA) => {
        const totalReviews = platforms.reduce((sum, p) => sum + p.totalReviews, 0);
        const weightedRating =
          totalReviews > 0
            ? platforms.reduce((sum, p) => sum + p.averageRating * p.totalReviews, 0) / totalReviews
            : 0;
        const positive = platforms.reduce((sum, p) => sum + p.positiveCount, 0);
        const neutral = platforms.reduce((sum, p) => sum + p.neutralCount, 0);
        const negative = platforms.reduce((sum, p) => sum + p.negativeCount, 0);
        const allReviews: Review[] = platforms
          .flatMap((p) => {
            try {
              return JSON.parse(p.reviews) as Review[];
            } catch {
              return [];
            }
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        return {
          query,
          platforms,
          overallRating: Math.round(weightedRating * 10) / 10,
          totalReviews,
          sentimentBreakdown: { positive, neutral, negative },
          topReviews: allReviews,
        };
      };

      const resultA = buildResult(queryA, platformsA);
      const resultB = buildResult(queryB, platformsB);

      // Optionally save comparison
      if (userId) {
        storage.createComparison({
          userId,
          queryA,
          queryB,
          type,
          createdAt: new Date().toISOString(),
        });
      }

      return res.json({ a: resultA, b: resultB });
    } catch (err) {
      console.error("Compare error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

function generateContactInfo(query: string, type: "business" | "product", location?: string | null): ContactInfo {
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  const areaCode = ["212", "310", "415", "305", "312", "702", "404", "617", "503", "206"][query.length % 10];

  if (type === "product") {
    return {
      name: query,
      website: `https://www.${slug}.com`,
      email: `support@${slug}.com`,
      mapsUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    };
  }

  const streets = ["Main St", "Broadway", "Market St", "Oak Ave", "5th Ave", "Park Dr"];
  const street = streets[query.length % streets.length];
  const streetNum = 100 + (query.charCodeAt(0) * 37) % 9000;
  const cities = location && !location.match(/^-?\d+\./) ? location : "Los Angeles, CA";
  const closingHour = 7 + (query.charCodeAt(0) % 5);

  return {
    name: query,
    address: `${streetNum} ${street}, ${cities}`,
    phone: `(${areaCode}) ${String(200 + query.length * 17).slice(0, 3)}-${String(1000 + query.charCodeAt(0) * 7).slice(0, 4)}`,
    email: `info@${slug}.com`,
    website: `https://www.${slug}.com`,
    mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(query + (location ? " " + location : ""))}`,
    hours: `Open until ${closingHour} PM`,
  };
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

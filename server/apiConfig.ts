// API Configuration — Environment Variables
// Set these in your .env or server environment before running

export const config = {
  // Google Places API (New) — https://console.cloud.google.com/apis
  // Enables: business search + reviews from Google Maps
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || "",

  // Yelp Fusion API — https://www.yelp.com/developers/v3/manage_app
  // Enables: business search + up to 3 reviews per business
  YELP_API_KEY: process.env.YELP_API_KEY || "",

  // Reddit API — https://www.reddit.com/prefs/apps
  // Enables: searching subreddits for review discussions
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID || "",
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET || "",

  // SerpAPI — https://serpapi.com/manage-api-key
  // Enables: Google Shopping product reviews, Trustpilot, etc.
  SERPAPI_KEY: process.env.SERPAPI_KEY || "",
};

export function getEnabledPlatforms(type: "business" | "product"): string[] {
  const platforms: string[] = [];

  if (type === "business") {
    if (config.GOOGLE_PLACES_API_KEY) platforms.push("google");
    if (config.YELP_API_KEY) platforms.push("yelp");
    if (config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET) platforms.push("reddit");
    // Always include these — we use SerpAPI or mock fallback
    platforms.push("tripadvisor");
    platforms.push("facebook");
  } else {
    if (config.SERPAPI_KEY) platforms.push("amazon");
    if (config.GOOGLE_PLACES_API_KEY || config.SERPAPI_KEY) platforms.push("google");
    if (config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET) platforms.push("reddit");
    platforms.push("trustpilot");
    platforms.push("bestbuy");
  }

  return platforms;
}

export function isApiConfigured(platform: string): boolean {
  switch (platform) {
    case "google": return !!config.GOOGLE_PLACES_API_KEY;
    case "yelp": return !!config.YELP_API_KEY;
    case "reddit": return !!(config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET);
    case "amazon": return !!config.SERPAPI_KEY;
    case "trustpilot": return !!config.SERPAPI_KEY;
    case "tripadvisor": return !!config.SERPAPI_KEY;
    default: return false;
  }
}

// Status endpoint data
export function getApiStatus() {
  return {
    google: { configured: !!config.GOOGLE_PLACES_API_KEY, label: "Google Places API" },
    yelp: { configured: !!config.YELP_API_KEY, label: "Yelp Fusion API" },
    reddit: { configured: !!(config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET), label: "Reddit API" },
    serpapi: { configured: !!config.SERPAPI_KEY, label: "SerpAPI (Amazon, TripAdvisor, Trustpilot)" },
  };
}

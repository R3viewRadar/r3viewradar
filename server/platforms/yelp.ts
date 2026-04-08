import { config } from "../apiConfig";
import { getCached, setCache, cacheKey } from "../cache";
import type { Review } from "@shared/schema";

interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  url: string;
  image_url?: string;
}

interface YelpReview {
  id: string;
  text: string;
  rating: number;
  time_created: string;
  user: { name: string; image_url?: string };
}

export async function searchYelp(query: string, location?: string | null) {
  const locationSuffix = location ? `_${location}` : "";
  const key = cacheKey("yelp", query + locationSuffix, "business");
  const cached = getCached<ReturnType<typeof formatResult>>(key);
  if (cached) return cached;

  if (!config.YELP_API_KEY) return null;

  try {
    // Build search params with location support
    const searchParams: Record<string, string> = {
      term: query,
      limit: "1",
      sort_by: "best_match",
    };

    // If location looks like "lat,lng", use latitude/longitude params
    const latLngMatch = location?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (latLngMatch) {
      searchParams.latitude = latLngMatch[1];
      searchParams.longitude = latLngMatch[2];
    } else {
      searchParams.location = location || "United States";
    }

    // Step 1: Search for the business
    const searchResponse = await fetch(
      `https://api.yelp.com/v3/businesses/search?${new URLSearchParams(searchParams)}`,
      {
        headers: {
          Authorization: `Bearer ${config.YELP_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      console.error("Yelp search error:", searchResponse.status, await searchResponse.text());
      return null;
    }

    const searchData = await searchResponse.json();
    const business: YelpBusiness = searchData.businesses?.[0];

    if (!business) return null;

    // Step 2: Get up to 3 reviews
    const reviewsResponse = await fetch(
      `https://api.yelp.com/v3/businesses/${business.id}/reviews?limit=3&sort_by=yelp_sort`,
      {
        headers: {
          Authorization: `Bearer ${config.YELP_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    let yelpReviews: YelpReview[] = [];
    if (reviewsResponse.ok) {
      const reviewData = await reviewsResponse.json();
      yelpReviews = reviewData.reviews || [];
    }

    const result = formatResult(business, yelpReviews);
    setCache(key, result);
    return result;
  } catch (err) {
    console.error("Yelp fetch error:", err);
    return null;
  }
}

function formatResult(business: YelpBusiness, yelpReviews: YelpReview[]) {
  const reviews: Review[] = yelpReviews.map((r, i) => ({
    id: `yelp-${r.id || i}`,
    author: r.user?.name || "Yelp User",
    rating: r.rating,
    text: r.text || "",
    date: r.time_created
      ? r.time_created.split(" ")[0]
      : new Date().toISOString().split("T")[0],
    helpful: 0,
    verified: true,
    platform: "Yelp",
  }));

  const totalReviews = business.review_count || reviews.length;
  const avgRating = business.rating || 0;

  // Estimate sentiment from overall rating
  const positiveRatio = avgRating >= 4 ? 0.65 : avgRating >= 3 ? 0.4 : 0.2;
  const neutralRatio = avgRating >= 3 ? 0.2 : 0.25;
  const positiveCount = Math.round(totalReviews * positiveRatio);
  const neutralCount = Math.round(totalReviews * neutralRatio);
  const negativeCount = totalReviews - positiveCount - neutralCount;

  return {
    platform: "Yelp",
    platformIcon: "yelp",
    totalReviews,
    averageRating: Math.round(avgRating * 10) / 10,
    positiveCount: Math.max(positiveCount, 0),
    neutralCount: Math.max(neutralCount, 0),
    negativeCount: Math.max(negativeCount, 0),
    reviews: JSON.stringify(reviews),
    url: business.url || `https://www.yelp.com/search?find_desc=${encodeURIComponent(business.name)}`,
    isLive: true,
  };
}

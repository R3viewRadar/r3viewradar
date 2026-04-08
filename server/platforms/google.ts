import { config } from "../apiConfig";
import { getCached, setCache, cacheKey } from "../cache";
import type { Review } from "@shared/schema";

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name?: string;
    relativePublishTimeDescription?: string;
    rating: number;
    text?: { text: string };
    authorAttribution?: { displayName: string; uri?: string; photoUri?: string };
    publishTime?: string;
  }>;
  websiteUri?: string;
  googleMapsUri?: string;
}

export async function searchGooglePlaces(query: string, type: "business" | "product", location?: string | null) {
  const locationSuffix = location ? `_${location}` : "";
  const key = cacheKey("google", query + locationSuffix, type);
  const cached = getCached<ReturnType<typeof formatResult>>(key);
  if (cached) return cached;

  if (!config.GOOGLE_PLACES_API_KEY) return null;

  try {
    // Build request body with optional location bias
    const requestBody: any = {
      textQuery: query,
      maxResultCount: 1,
      languageCode: "en",
    };

    // If location looks like "lat,lng" (from browser geolocation), use locationBias
    if (location) {
      const latLngMatch = location.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
      if (latLngMatch) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: parseFloat(latLngMatch[1]),
              longitude: parseFloat(latLngMatch[2]),
            },
            radius: 20000, // 20km radius
          },
        };
      } else {
        // Treat as a place name / zip code — append to query
        requestBody.textQuery = `${query} near ${location}`;
      }
    }

    // Use Text Search (New) to find the place
    const searchResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.websiteUri,places.googleMapsUri",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!searchResponse.ok) {
      console.error("Google Places API error:", searchResponse.status, await searchResponse.text());
      return null;
    }

    const data = await searchResponse.json();
    const place: GooglePlaceResult = data.places?.[0];

    if (!place) return null;

    const result = formatResult(place, query);
    setCache(key, result);
    return result;
  } catch (err) {
    console.error("Google Places fetch error:", err);
    return null;
  }
}

function formatResult(place: GooglePlaceResult, query: string) {
  const reviews: Review[] = (place.reviews || []).map((r, i) => ({
    id: `google-${i}-${Date.now()}`,
    author: r.authorAttribution?.displayName || "Google User",
    rating: r.rating || 0,
    text: r.text?.text || "",
    date: r.publishTime
      ? new Date(r.publishTime).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    helpful: 0,
    verified: true,
    platform: "Google",
  }));

  const totalReviews = place.userRatingCount || reviews.length;
  const avgRating = place.rating || 0;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;

  // Estimate sentiment breakdown proportionally
  const positiveCount = totalReviews > 0 ? Math.round(totalReviews * (positive / Math.max(reviews.length, 1))) : 0;
  const neutralCount = totalReviews > 0 ? Math.round(totalReviews * (neutral / Math.max(reviews.length, 1))) : 0;
  const negativeCount = totalReviews - positiveCount - neutralCount;

  return {
    platform: "Google",
    platformIcon: "google",
    totalReviews,
    averageRating: Math.round(avgRating * 10) / 10,
    positiveCount: Math.max(positiveCount, 0),
    neutralCount: Math.max(neutralCount, 0),
    negativeCount: Math.max(negativeCount, 0),
    reviews: JSON.stringify(reviews),
    url: place.googleMapsUri || `https://www.google.com/search?q=${encodeURIComponent(query)}+reviews`,
    isLive: true,
  };
}

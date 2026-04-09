import { config } from "../apiConfig";
import { getCached, setCache, cacheKey } from "../cache";
import type { Review, NearbyLocation, ContactInfo } from "@shared/schema";

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

/**
 * Search for multiple nearby locations using Google Places Text Search.
 * Returns real addresses, phone numbers, hours, ratings.
 */
export async function searchGoogleNearbyLocations(
  query: string,
  location?: string | null
): Promise<{ locations: NearbyLocation[]; contactInfo?: ContactInfo } | null> {
  const locSuffix = location ? `_${location}` : "";
  const key = cacheKey("google_nearby", query + locSuffix, "business");
  const cached = getCached<{ locations: NearbyLocation[]; contactInfo?: ContactInfo }>(key);
  if (cached) return cached;

  if (!config.GOOGLE_PLACES_API_KEY) return null;

  try {
    const requestBody: any = {
      textQuery: location ? `${query} in ${location}` : query,
      maxResultCount: 20,
      languageCode: "en",
    };

    // If location is lat,lng, use locationBias
    const latLngMatch = location?.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
    if (latLngMatch) {
      requestBody.textQuery = query;
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(latLngMatch[1]),
            longitude: parseFloat(latLngMatch[2]),
          },
          radius: 40000,
        },
      };
    }

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.currentOpeningHours,places.types",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!res.ok) {
      console.error("Google Nearby error:", res.status);
      return null;
    }

    const data = await res.json();
    const places = data.places || [];

    if (places.length === 0) return null;

    const locations: NearbyLocation[] = places.map((p: any, i: number) => {
      const isOpen = p.currentOpeningHours?.openNow;
      const hoursText = isOpen === true ? "Open now" : isOpen === false ? "Closed now" : undefined;

      return {
        id: p.id || `gplace-${i}`,
        name: p.displayName?.text || query,
        address: p.formattedAddress || "",
        rating: p.rating ? Math.round(p.rating * 10) / 10 : undefined,
        reviewCount: p.userRatingCount || undefined,
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || undefined,
        website: p.websiteUri || undefined,
        hours: hoursText || undefined,
        mapsUrl: p.googleMapsUri || `https://www.google.com/maps/search/${encodeURIComponent(p.formattedAddress || query)}`,
        category: formatPlaceTypes(p.types),
      };
    });

    // Build contactInfo from the first result
    const first = places[0];
    const contactInfo: ContactInfo = {
      name: first.displayName?.text || query,
      address: first.formattedAddress || undefined,
      phone: first.nationalPhoneNumber || first.internationalPhoneNumber || undefined,
      email: undefined, // Google doesn't provide email
      website: first.websiteUri || undefined,
      mapsUrl: first.googleMapsUri || undefined,
      hours: first.currentOpeningHours?.openNow === true ? "Open now" : first.currentOpeningHours?.openNow === false ? "Closed now" : undefined,
    };

    const result = { locations, contactInfo };
    setCache(key, result);
    return result;
  } catch (err) {
    console.error("Google Nearby fetch error:", err);
    return null;
  }
}

function formatPlaceTypes(types?: string[]): string | undefined {
  if (!types || types.length === 0) return undefined;
  const typeMap: Record<string, string> = {
    restaurant: "Restaurant", cafe: "Cafe", coffee_shop: "Coffee Shop",
    bar: "Bar", bakery: "Bakery", meal_takeaway: "Takeaway",
    meal_delivery: "Delivery", grocery_or_supermarket: "Grocery Store",
    supermarket: "Supermarket", store: "Store", shopping_mall: "Shopping Mall",
    electronics_store: "Electronics Store", department_store: "Department Store",
    hardware_store: "Hardware Store", pharmacy: "Pharmacy", drugstore: "Drugstore",
    hospital: "Hospital", doctor: "Doctor", dentist: "Dentist",
    gym: "Gym", hair_care: "Hair Salon", spa: "Spa",
    lodging: "Hotel", gas_station: "Gas Station", bank: "Bank",
  };
  for (const t of types) {
    if (typeMap[t]) return typeMap[t];
  }
  return undefined;
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

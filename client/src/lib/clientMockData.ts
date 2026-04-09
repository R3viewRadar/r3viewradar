/**
 * Client-side mock data generator — used as fallback when the backend API is unreachable
 * (e.g., when deployed to a static host like r3viewradar.com without the Express server).
 */
import type { SearchResultData, Review, ReviewResult, SourceLink, NearbyLocation, ContactInfo } from "@shared/schema";

const BUSINESS_PLATFORMS = [
  { name: "Google", icon: "google", url: "https://google.com/maps" },
  { name: "Yelp", icon: "yelp", url: "https://yelp.com" },
  { name: "TripAdvisor", icon: "tripadvisor", url: "https://tripadvisor.com" },
  { name: "Facebook", icon: "facebook", url: "https://facebook.com" },
  { name: "Reddit", icon: "reddit", url: "https://reddit.com" },
];

const PRODUCT_PLATFORMS = [
  { name: "Amazon", icon: "amazon", url: "https://amazon.com" },
  { name: "Google", icon: "google", url: "https://google.com/shopping" },
  { name: "Reddit", icon: "reddit", url: "https://reddit.com" },
  { name: "Trustpilot", icon: "trustpilot", url: "https://trustpilot.com" },
  { name: "Best Buy", icon: "bestbuy", url: "https://bestbuy.com" },
];

const POSITIVE_REVIEWS = [
  "Absolutely love this place! The service was impeccable and everything exceeded my expectations. Will definitely be back.",
  "One of the best experiences I've had. Top-notch quality, friendly staff, and great value for money.",
  "Exceeded all my expectations. The attention to detail is remarkable. Highly recommend to anyone!",
  "Outstanding! From start to finish, everything was perfect. Five stars isn't enough.",
  "A hidden gem. The quality is unmatched and the experience feels truly premium.",
  "Blown away by how good this is. Way better than competitors at this price point.",
  "Cannot recommend this enough. Consistent quality, great support, and exactly as advertised.",
  "My go-to choice now. Tried many alternatives but this stands out in every way.",
];

const NEUTRAL_REVIEWS = [
  "Decent overall, but there's room for improvement. The core experience is solid, though a few rough edges.",
  "Pretty good for the price. Nothing mind-blowing but gets the job done reliably.",
  "Had some mixed experiences here. Some things were great, others felt a bit average.",
  "It's fine. Met my basic needs but didn't really wow me. Might try alternatives in the future.",
  "Above average in most areas, just okay in others. A decent option if you manage expectations.",
  "Good but not great. There are better options out there but this is a reasonable choice.",
];

const NEGATIVE_REVIEWS = [
  "Disappointed with the experience. Quality didn't match the price or the hype. Expected more.",
  "Had issues that weren't resolved despite multiple follow-ups. Customer service could be much better.",
  "Not worth it in my opinion. Fell short in several key areas. Look elsewhere.",
  "Below expectations. The photos / description were misleading. Won't be returning.",
  "Frustrating experience overall. Too many problems for the price they're charging.",
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReviews(platform: string, count: number, targetRating: number): Review[] {
  const reviews: Review[] = [];
  const firstNames = ["James", "Sarah", "Michael", "Emily", "David", "Jessica", "Chris", "Ashley", "Matthew", "Amanda", "Daniel", "Lauren", "Andrew", "Stephanie", "Joshua", "Nicole", "Ryan", "Megan", "Tyler", "Rachel", "Alex", "Morgan", "Jordan", "Taylor", "Casey", "Jamie"];
  const lastInitials = "ABCDEFGHJKLMNOPRSTW".split("");

  for (let i = 0; i < count; i++) {
    const name = `${pickRandom(firstNames)} ${pickRandom(lastInitials)}.`;
    let rating: number;
    const r = Math.random();
    if (targetRating >= 4.2) {
      rating = r < 0.65 ? 5 : r < 0.85 ? 4 : r < 0.93 ? 3 : r < 0.97 ? 2 : 1;
    } else if (targetRating >= 3.5) {
      rating = r < 0.3 ? 5 : r < 0.55 ? 4 : r < 0.75 ? 3 : r < 0.88 ? 2 : 1;
    } else {
      rating = r < 0.15 ? 5 : r < 0.3 ? 4 : r < 0.5 ? 3 : r < 0.72 ? 2 : 1;
    }

    const text = rating >= 4
      ? pickRandom(POSITIVE_REVIEWS)
      : rating === 3
      ? pickRandom(NEUTRAL_REVIEWS)
      : pickRandom(NEGATIVE_REVIEWS);

    const daysAgo = randomBetween(0, 365);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    reviews.push({
      id: `${platform}-${i}`,
      author: name,
      rating,
      text,
      date: date.toISOString().split("T")[0],
      helpful: randomBetween(0, 120),
      verified: Math.random() > 0.35,
      platform,
    });
  }

  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateClientMockData(
  query: string,
  type: "business" | "product",
  category?: string | null,
  location?: string | null
): SearchResultData {
  const platformDefs = type === "business" ? BUSINESS_PLATFORMS : PRODUCT_PLATFORMS;

  const seed = query.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseRating = 3.2 + (seed % 20) / 10;

  let totalReviewsAll = 0;
  let weightedSum = 0;
  let positiveAll = 0;
  let neutralAll = 0;
  let negativeAll = 0;
  const allReviews: Review[] = [];

  const platforms: ReviewResult[] = platformDefs.map((platform, i) => {
    const ratingVariance = ((seed + i * 7) % 16 - 8) / 10;
    const rating = Math.min(5, Math.max(1.5, baseRating + ratingVariance));
    const totalReviews = randomBetween(40, 850);
    const reviews = generateReviews(platform.name, Math.min(totalReviews, 8), rating);

    const positive = reviews.filter(r => r.rating >= 4).length;
    const neutral = reviews.filter(r => r.rating === 3).length;
    const negative = reviews.filter(r => r.rating <= 2).length;

    const positiveCount = Math.round(totalReviews * (positive / reviews.length));
    const neutralCount = Math.round(totalReviews * (neutral / reviews.length));
    const negativeCount = Math.round(totalReviews * (negative / reviews.length));

    totalReviewsAll += totalReviews;
    weightedSum += rating * totalReviews;
    positiveAll += positiveCount;
    neutralAll += neutralCount;
    negativeAll += negativeCount;
    allReviews.push(...reviews);

    return {
      id: i + 1,
      searchId: 1,
      platform: platform.name,
      platformIcon: platform.icon,
      totalReviews,
      averageRating: Math.round(rating * 10) / 10,
      positiveCount,
      neutralCount,
      negativeCount,
      reviews: JSON.stringify(reviews),
      url: platform.url,
    };
  });

  const overallRating = Math.round((weightedSum / totalReviewsAll) * 10) / 10;

  // Generate source links
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const sourceLinks: SourceLink[] = platformDefs.map((p) => {
    const urlMap: Record<string, { url: string; title: string; desc: string }> = {
      Google: {
        url: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
        title: `${query} on Google Maps`,
        desc: `See ratings, photos, hours, and directions for ${query} on Google Maps.`,
      },
      Yelp: {
        url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}`,
        title: `${query} on Yelp`,
        desc: `Read community reviews, check menus, and find contact info on Yelp.`,
      },
      TripAdvisor: {
        url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`,
        title: `${query} on TripAdvisor`,
        desc: `Traveler reviews, rankings, and photos for ${query}.`,
      },
      Facebook: {
        url: `https://www.facebook.com/search/pages?q=${encodeURIComponent(query)}`,
        title: `${query} on Facebook`,
        desc: `Community page with posts, recommendations, and check-ins.`,
      },
      Reddit: {
        url: `https://www.reddit.com/search/?q=${encodeURIComponent(query + " review")}`,
        title: `${query} reviews on Reddit`,
        desc: `Community discussions, honest opinions, and user experiences.`,
      },
      Amazon: {
        url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
        title: `${query} on Amazon`,
        desc: `Product listings with verified purchase reviews and ratings.`,
      },
      Trustpilot: {
        url: `https://www.trustpilot.com/search?query=${encodeURIComponent(query)}`,
        title: `${query} on Trustpilot`,
        desc: `Consumer trust ratings and detailed customer experiences.`,
      },
      "Best Buy": {
        url: `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`,
        title: `${query} on Best Buy`,
        desc: `Expert and customer reviews for electronics and tech products.`,
      },
    };
    const info = urlMap[p.name] || { url: p.url, title: `${query} on ${p.name}`, desc: `Reviews on ${p.name}.` };
    return {
      platform: p.name,
      platformIcon: p.icon,
      url: info.url,
      title: info.title,
      description: info.desc,
    };
  });

  // Generate nearby locations for business searches
  let nearbyLocations: NearbyLocation[] | undefined;

  if (type === "business") {
    const streets = [
      "Main St", "Broadway", "Market St", "Oak Ave", "Elm Blvd", "5th Ave",
      "Park Dr", "Pine Rd", "Cedar Ln", "Maple Way", "Highland Ave", "River Rd",
      "Washington Ave", "Lincoln Ave", "Commerce Blvd", "Central Ave", "Union St",
      "Lake Dr", "Spring St", "Church Rd",
    ];

    // Resolve the user's location into a display city
    const userCity = resolveLocationToCity(location);

    const categoryMap: Record<string, string> = {
      doctor: "Medical Practice", dentist: "Dental Office", dr: "Medical Practice",
      restaurant: "Restaurant", pizza: "Pizza Restaurant", sushi: "Sushi Restaurant",
      coffee: "Coffee Shop", starbucks: "Coffee Shop", dunkin: "Coffee & Donuts",
      gym: "Fitness Center", salon: "Hair Salon", spa: "Spa & Wellness",
      hotel: "Hotel", "best buy": "Electronics Store", target: "Department Store",
      walmart: "Supercenter", costco: "Wholesale Club", "trader joe": "Grocery Store",
      "whole foods": "Grocery Store", walgreens: "Pharmacy", cvs: "Pharmacy",
      "home depot": "Hardware Store", chipotle: "Mexican Restaurant",
      mcdonald: "Fast Food", subway: "Fast Food", "burger king": "Fast Food",
    };
    const queryLower = query.toLowerCase();
    const detectedCat = Object.entries(categoryMap).find(([k]) => queryLower.includes(k))?.[1] || "Business";

    const areaCode = getAreaCodeForLocation(location);
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
    const count = randomBetween(12, 18);

    nearbyLocations = Array.from({ length: count }, (_, i) => {
      const dist = (0.2 + i * 0.8 + Math.random() * 1.5).toFixed(1);
      const streetNum = randomBetween(100, 9900);
      const street = streets[i % streets.length];
      const closingHour = 6 + randomBetween(0, 5);
      const phone = `(${areaCode}) ${randomBetween(200, 999)}-${randomBetween(1000, 9999)}`;

      return {
        id: `loc-${i}`,
        name: `${query} — ${street}`,
        address: `${streetNum} ${street}, ${userCity}`,
        distance: `${dist} mi`,
        rating: Math.round((2.8 + Math.random() * 2.2) * 10) / 10,
        reviewCount: randomBetween(15, 800),
        phone,
        website: `https://www.${slug}.com`,
        hours: Math.random() > 0.15 ? `Open until ${closingHour} PM` : "Closed now",
        mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(query + " " + streetNum + " " + street + " " + userCity)}`,
        category: detectedCat,
      };
    }).sort((a, b) => parseFloat(a.distance!) - parseFloat(b.distance!));
  }

  // Generate contact info
  const contactInfo: ContactInfo = generateContactInfo(query, type, location);

  return {
    search: {
      id: 1,
      query,
      type,
      category: category ?? null,
      location: location ?? null,
      timestamp: new Date().toISOString(),
    },
    platforms,
    overallRating,
    totalReviews: totalReviewsAll,
    sentimentBreakdown: {
      positive: positiveAll,
      neutral: neutralAll,
      negative: negativeAll,
    },
    allReviews: allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    sourceLinks,
    nearbyLocations,
    contactInfo,
  };
}

function generateContactInfo(query: string, type: "business" | "product", location?: string | null): ContactInfo {
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  const areaCode = getAreaCodeForLocation(location);
  const streets = ["Main St", "Broadway", "Market St", "Oak Ave", "5th Ave", "Park Dr"];
  const userCity = resolveLocationToCity(location);
  const streetNum = 100 + (query.charCodeAt(0) * 37) % 9000;
  const street = streets[query.length % streets.length];

  if (type === "product") {
    return {
      name: query,
      website: `https://www.${slug}.com`,
      email: `support@${slug}.com`,
      mapsUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    };
  }

  // Business
  const closingHour = 7 + (query.charCodeAt(0) % 5);
  return {
    name: query,
    address: `${streetNum} ${street}, ${userCity}`,
    phone: `(${areaCode}) ${String(200 + query.length * 17).slice(0, 3)}-${String(1000 + query.charCodeAt(0) * 7).slice(0, 4)}`,
    email: `info@${slug}.com`,
    website: `https://www.${slug}.com`,
    mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(query + (location ? " " + location : ""))}`,
    hours: `Open until ${closingHour} PM`,
  };
}

/**
 * Resolve user-provided location into a display-friendly city string.
 * Handles zip codes, city names, and lat/lng coordinates.
 */
function resolveLocationToCity(location?: string | null): string {
  if (!location) return "New York, NY";

  // If it's lat,lng coordinates, show "Your Area"
  if (location.match(/^-?\d+\./)) return "Your Area";

  // If it's a zip code, map to a known city
  const zipMap: Record<string, string> = {
    "100": "New York, NY", "101": "New York, NY", "102": "New York, NY", "103": "Staten Island, NY",
    "104": "Bronx, NY", "110": "Queens, NY", "111": "Long Island City, NY", "112": "Brooklyn, NY",
    "200": "Washington, DC", "201": "Washington, DC", "206": "Washington, DC",
    "210": "Baltimore, MD", "212": "Baltimore, MD",
    "300": "Atlanta, GA", "303": "Atlanta, GA", "304": "Atlanta, GA",
    "331": "Miami, FL", "332": "Miami, FL", "333": "Fort Lauderdale, FL",
    "334": "West Palm Beach, FL", "336": "Tampa, FL",
    "400": "Louisville, KY",
    "432": "Columbus, OH", "441": "Cleveland, OH", "452": "Cincinnati, OH",
    "460": "Indianapolis, IN",
    "500": "Des Moines, IA",
    "550": "Minneapolis, MN", "551": "St. Paul, MN",
    "600": "Chicago, IL", "606": "Chicago, IL", "607": "Chicago, IL",
    "630": "St. Louis, MO",
    "700": "New Orleans, LA", "701": "New Orleans, LA",
    "750": "Dallas, TX", "752": "Dallas, TX", "760": "Fort Worth, TX",
    "770": "Houston, TX", "773": "Houston, TX",
    "780": "San Antonio, TX", "786": "Austin, TX", "787": "Austin, TX",
    "800": "Denver, CO", "802": "Denver, CO",
    "850": "Phoenix, AZ", "852": "Phoenix, AZ", "853": "Phoenix, AZ",
    "891": "Las Vegas, NV", "890": "Las Vegas, NV", "891": "Las Vegas, NV",
    "900": "Los Angeles, CA", "901": "Los Angeles, CA", "902": "Inglewood, CA",
    "904": "Santa Monica, CA", "906": "Whittier, CA", "910": "Pasadena, CA",
    "920": "San Diego, CA", "921": "San Diego, CA",
    "941": "San Francisco, CA", "943": "Palo Alto, CA", "945": "Oakland, CA",
    "950": "San Jose, CA", "951": "San Jose, CA",
    "970": "Portland, OR", "972": "Portland, OR",
    "980": "Seattle, WA", "981": "Seattle, WA", "982": "Tacoma, WA",
  };

  // Check if it's a zip code (5 digits)
  const zipMatch = location.match(/^(\d{3})\d{2}$/);
  if (zipMatch) {
    const prefix = zipMatch[1];
    return zipMap[prefix] || `Zip ${location}`;
  }

  // Otherwise treat as a city name and return as-is
  return location;
}

/**
 * Get a realistic area code based on the user's location.
 */
function getAreaCodeForLocation(location?: string | null): string {
  if (!location) return "212";

  const locLower = (location || "").toLowerCase();

  // Check for city names
  const cityAreaCodes: Record<string, string> = {
    "new york": "212", "nyc": "212", "manhattan": "212", "brooklyn": "718", "queens": "718",
    "bronx": "718", "staten island": "718",
    "los angeles": "310", "la": "310", "hollywood": "323",
    "san francisco": "415", "sf": "415", "oakland": "510",
    "chicago": "312", "houston": "713", "dallas": "214", "austin": "512",
    "san antonio": "210", "fort worth": "817",
    "miami": "305", "fort lauderdale": "954", "tampa": "813", "orlando": "407",
    "atlanta": "404", "boston": "617", "seattle": "206", "portland": "503",
    "denver": "303", "phoenix": "602", "las vegas": "702",
    "san diego": "619", "san jose": "408",
    "detroit": "313", "minneapolis": "612", "st. louis": "314",
    "baltimore": "410", "washington": "202", "dc": "202",
    "philadelphia": "215", "pittsburgh": "412",
    "cleveland": "216", "columbus": "614", "cincinnati": "513",
    "nashville": "615", "memphis": "901", "charlotte": "704",
    "indianapolis": "317", "milwaukee": "414", "kansas city": "816",
    "new orleans": "504", "salt lake": "801", "sacramento": "916",
  };

  for (const [city, code] of Object.entries(cityAreaCodes)) {
    if (locLower.includes(city)) return code;
  }

  // Check for zip code prefix
  const zipMatch = location?.match(/^(\d{3})/);
  if (zipMatch) {
    const zipAreaCodes: Record<string, string> = {
      "100": "212", "112": "718", "200": "202", "210": "410", "300": "404",
      "331": "305", "332": "305", "336": "813", "441": "216", "452": "513",
      "600": "312", "606": "312", "700": "504", "750": "214", "770": "713",
      "786": "512", "800": "303", "850": "602", "890": "702", "900": "310",
      "920": "619", "941": "415", "950": "408", "970": "503", "980": "206",
    };
    return zipAreaCodes[zipMatch[1]] || "555";
  }

  return "555";
}

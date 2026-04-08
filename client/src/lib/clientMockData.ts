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

  // Generate nearby locations for chain businesses
  const CHAIN_BUSINESSES = [
    "trader joe", "starbucks", "chipotle", "mcdonald", "subway", "target", "walmart",
    "costco", "whole foods", "walgreens", "cvs", "home depot", "lowes", "best buy",
    "dunkin", "chick-fil-a", "panera", "olive garden", "applebee", "wendy",
    "burger king", "taco bell", "panda express", "five guys", "shake shack",
    "popeyes", "chili", "ihop", "denny", "pizza hut", "domino", "papa john",
    "krispy kreme", "7-eleven", "wawa", "aldi", "publix", "safeway", "kroger",
  ];
  const isChain = type === "business" && CHAIN_BUSINESSES.some(c => query.toLowerCase().includes(c));
  let nearbyLocations: NearbyLocation[] | undefined;

  if (isChain) {
    const streets = [
      "Main St", "Broadway", "Market St", "Oak Ave", "Elm Blvd", "5th Ave",
      "Park Dr", "Pine Rd", "Cedar Ln", "Maple Way", "Highland Ave", "River Rd",
    ];
    const cities = location && !location.match(/^-?\d+\./) 
      ? [location, location, location, location, location, location]
      : ["Beverly Hills, CA", "Santa Monica, CA", "West Hollywood, CA", "Los Angeles, CA", "Culver City, CA", "Pasadena, CA"];

    nearbyLocations = Array.from({ length: 6 }, (_, i) => {
      const dist = (0.3 + i * 1.2 + Math.random() * 0.8).toFixed(1);
      const streetNum = randomBetween(100, 9900);
      return {
        id: `loc-${i}`,
        name: `${query} — ${pickRandom(streets)}`,
        address: `${streetNum} ${streets[i % streets.length]}, ${cities[i % cities.length]}`,
        distance: `${dist} mi`,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: randomBetween(40, 600),
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
  const areaCode = ["212", "310", "415", "305", "312", "702", "404", "617", "503", "206"][query.length % 10];
  const streets = ["Main St", "Broadway", "Market St", "Oak Ave", "5th Ave", "Park Dr"];
  const cities = location && !location.match(/^-?\d+\./) ? location : "Los Angeles, CA";
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
  const closingHour = 7 + (query.charCodeAt(0) % 5); // 7-11 PM
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

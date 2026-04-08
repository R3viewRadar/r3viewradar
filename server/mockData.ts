import type { Review } from "@shared/schema";

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

export function generateMockData(query: string, type: "business" | "product") {
  const platforms = type === "business" ? BUSINESS_PLATFORMS : PRODUCT_PLATFORMS;

  // Generate a consistent-ish rating based on query (so same query = same result in demo)
  const seed = query.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseRating = 3.2 + (seed % 20) / 10; // 3.2 - 5.2, clamped

  const results = platforms.map((platform, i) => {
    // Slightly vary per platform
    const ratingVariance = ((seed + i * 7) % 16 - 8) / 10;
    const rating = Math.min(5, Math.max(1.5, baseRating + ratingVariance));
    const totalReviews = randomBetween(40, 850);
    const reviews = generateReviews(platform.name, Math.min(totalReviews, 8), rating);

    const positive = reviews.filter(r => r.rating >= 4).length;
    const neutral = reviews.filter(r => r.rating === 3).length;
    const negative = reviews.filter(r => r.rating <= 2).length;

    return {
      platform: platform.name,
      platformIcon: platform.icon,
      totalReviews,
      averageRating: Math.round(rating * 10) / 10,
      positiveCount: Math.round(totalReviews * (positive / reviews.length)),
      neutralCount: Math.round(totalReviews * (neutral / reviews.length)),
      negativeCount: Math.round(totalReviews * (negative / reviews.length)),
      reviews: JSON.stringify(reviews),
      url: platform.url,
    };
  });

  return results;
}

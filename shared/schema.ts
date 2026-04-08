import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Search history table
export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  type: text("type").notNull(), // "business" | "product"
  category: text("category"),
  location: text("location"), // zip code, city name, or "lat,lng" from geolocation
  timestamp: text("timestamp").notNull(),
});

// Review results table
export const reviewResults = sqliteTable("review_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  searchId: integer("search_id").notNull(),
  platform: text("platform").notNull(),
  platformIcon: text("platform_icon").notNull(),
  totalReviews: integer("total_reviews").notNull().default(0),
  averageRating: real("average_rating").notNull().default(0),
  positiveCount: integer("positive_count").notNull().default(0),
  neutralCount: integer("neutral_count").notNull().default(0),
  negativeCount: integer("negative_count").notNull().default(0),
  reviews: text("reviews").notNull().default("[]"), // JSON array
  url: text("url"),
});

export const insertSearchSchema = createInsertSchema(searches).omit({ id: true });
export const insertReviewResultSchema = createInsertSchema(reviewResults).omit({ id: true });

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type InsertReviewResult = z.infer<typeof insertReviewResultSchema>;
export type Search = typeof searches.$inferSelect;
export type ReviewResult = typeof reviewResults.$inferSelect;

// Individual review type (stored as JSON in reviewResults.reviews)
export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  helpful?: number;
  verified?: boolean;
  platform: string;
}

// Aggregated result for a search
export interface SearchResultData {
  search: Search;
  platforms: ReviewResult[];
  overallRating: number;
  totalReviews: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  allReviews: Review[];
}

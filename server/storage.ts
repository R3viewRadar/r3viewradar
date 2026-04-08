import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import {
  searches, reviewResults,
  type Search, type ReviewResult,
  type InsertSearch, type InsertReviewResult,
} from "@shared/schema";

const sqlite = new Database("reviewradar.db");
export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    location TEXT,
    timestamp TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS review_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    platform_icon TEXT NOT NULL,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    average_rating REAL NOT NULL DEFAULT 0,
    positive_count INTEGER NOT NULL DEFAULT 0,
    neutral_count INTEGER NOT NULL DEFAULT 0,
    negative_count INTEGER NOT NULL DEFAULT 0,
    reviews TEXT NOT NULL DEFAULT '[]',
    url TEXT
  );
`);

export interface IStorage {
  createSearch(data: InsertSearch): Search;
  getSearch(id: number): Search | undefined;
  getRecentSearches(): Search[];
  createReviewResult(data: InsertReviewResult): ReviewResult;
  getReviewResultsBySearchId(searchId: number): ReviewResult[];
  deleteOldSearches(): void;
}

export const storage: IStorage = {
  createSearch(data: InsertSearch): Search {
    return db.insert(searches).values(data).returning().get() as Search;
  },

  getSearch(id: number): Search | undefined {
    return db.select().from(searches).where(eq(searches.id, id)).get();
  },

  getRecentSearches(): Search[] {
    return db.select().from(searches).all().slice(-20).reverse();
  },

  createReviewResult(data: InsertReviewResult): ReviewResult {
    return db.insert(reviewResults).values(data).returning().get() as ReviewResult;
  },

  getReviewResultsBySearchId(searchId: number): ReviewResult[] {
    return db.select().from(reviewResults).where(eq(reviewResults.searchId, searchId)).all();
  },

  deleteOldSearches(): void {
    // Keep only last 100 searches
    const all = db.select().from(searches).all();
    if (all.length > 100) {
      const toDelete = all.slice(0, all.length - 100);
      toDelete.forEach(s => {
        db.delete(reviewResults).where(eq(reviewResults.searchId, s.id)).run();
        db.delete(searches).where(eq(searches.id, s.id)).run();
      });
    }
  },
};

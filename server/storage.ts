import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import {
  searches, reviewResults, users, favorites, alerts, comparisons,
  type Search, type ReviewResult, type User, type Favorite, type Alert, type Comparison,
  type InsertSearch, type InsertReviewResult, type InsertUser, type InsertFavorite, type InsertAlert, type InsertComparison,
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
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    note TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    last_checked TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    query_a TEXT NOT NULL,
    query_b TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export interface IStorage {
  createSearch(data: InsertSearch): Search;
  getSearch(id: number): Search | undefined;
  getRecentSearches(): Search[];
  createReviewResult(data: InsertReviewResult): ReviewResult;
  getReviewResultsBySearchId(searchId: number): ReviewResult[];
  deleteOldSearches(): void;
  // Users
  createUser(data: InsertUser): User;
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  // Favorites
  createFavorite(data: InsertFavorite): Favorite;
  getFavoritesByUserId(userId: number): Favorite[];
  deleteFavorite(id: number): void;
  // Alerts
  createAlert(data: InsertAlert): Alert;
  getAlertsByUserId(userId: number): Alert[];
  toggleAlert(id: number): Alert | undefined;
  deleteAlert(id: number): void;
  // Comparisons
  createComparison(data: InsertComparison): Comparison;
  getComparisonsByUserId(userId: number): Comparison[];
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

  // Users
  createUser(data: InsertUser): User {
    return db.insert(users).values(data).returning().get() as User;
  },

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  },

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  },

  // Favorites
  createFavorite(data: InsertFavorite): Favorite {
    return db.insert(favorites).values(data).returning().get() as Favorite;
  },

  getFavoritesByUserId(userId: number): Favorite[] {
    return db.select().from(favorites).where(eq(favorites.userId, userId)).all();
  },

  deleteFavorite(id: number): void {
    db.delete(favorites).where(eq(favorites.id, id)).run();
  },

  // Alerts
  createAlert(data: InsertAlert): Alert {
    return db.insert(alerts).values(data).returning().get() as Alert;
  },

  getAlertsByUserId(userId: number): Alert[] {
    return db.select().from(alerts).where(eq(alerts.userId, userId)).all();
  },

  toggleAlert(id: number): Alert | undefined {
    const alert = db.select().from(alerts).where(eq(alerts.id, id)).get();
    if (!alert) return undefined;
    const newActive = alert.active ? 0 : 1;
    return db.update(alerts).set({ active: newActive }).where(eq(alerts.id, id)).returning().get() as Alert;
  },

  deleteAlert(id: number): void {
    db.delete(alerts).where(eq(alerts.id, id)).run();
  },

  // Comparisons
  createComparison(data: InsertComparison): Comparison {
    return db.insert(comparisons).values(data).returning().get() as Comparison;
  },

  getComparisonsByUserId(userId: number): Comparison[] {
    return db.select().from(comparisons).where(eq(comparisons.userId, userId)).all();
  },
};

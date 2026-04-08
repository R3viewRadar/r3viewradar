/**
 * Simple in-memory store for passing search result data between pages
 * when the backend API is unavailable (static hosting fallback).
 */
import type { SearchResultData } from "@shared/schema";

let pendingResult: SearchResultData | null = null;

export function setPendingResult(data: SearchResultData) {
  pendingResult = data;
}

export function consumePendingResult(): SearchResultData | null {
  const data = pendingResult;
  pendingResult = null;
  return data;
}

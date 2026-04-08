import { googleAdapter } from './google';
import { yelpAdapter } from './yelp';
import { redditAdapter } from './reddit';
import { amazonAdapter, tripadvisorAdapter, trustpilotAdapter } from './serpapi';
import type { PlatformAdapter } from '../types';

export const businessAdapters: PlatformAdapter[] = [
  googleAdapter,
  yelpAdapter,
  tripadvisorAdapter,
  redditAdapter,
];

export const productAdapters: PlatformAdapter[] = [
  amazonAdapter,
  googleAdapter,
  trustpilotAdapter,
  redditAdapter,
];

export const allAdapters: PlatformAdapter[] = [
  googleAdapter,
  yelpAdapter,
  redditAdapter,
  amazonAdapter,
  tripadvisorAdapter,
  trustpilotAdapter,
];

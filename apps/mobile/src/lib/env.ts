import Constants from "expo-constants";

/** What app.config.js hands the app from the monorepo's .env.local. */
type MobileExtra = {
  apiUrl?: string;
  siteUrl?: string;
  clerkPublishableKey?: string;
};

const extra: MobileExtra = Constants.expoConfig?.extra ?? {};

/** Where apps/api answers. Every request the app makes goes here, under /api/v1. */
export const API_URL = extra.apiUrl || "http://localhost:3002";

/** The public site, for a link a person shares. */
export const SITE_URL = extra.siteUrl || "https://mediary.com";

/** The identity service's publishable key, the same instance the site signs in with. */
export const CLERK_PUBLISHABLE_KEY = extra.clerkPublishableKey;

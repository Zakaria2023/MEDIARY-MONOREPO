import { MediaType, TrackingStatus } from "@/db/enum";
import { ProfileInput, UpsertEntryInput, WelcomeInput } from "validators";
import { API_URL } from "./env";
import {
  AuthUser,
  CatalogCard,
  CatalogGenreCount,
  CatalogSearchResult,
  CatalogShowcase,
  DiaryLine,
  FeatureFlags,
  FeedItem,
  LibraryCounts,
  LibraryItem,
  LibrarySort,
  NotificationItem,
  OwnProfile,
  Paginated,
  ProfileCounts,
  ProfileFavorite,
  PublicProfile,
  Recommendation,
  TitleCommunity,
  TitleDetail,
  TitleReview,
  TitleTracking,
  TrackedEntry,
  UserStats,
  WeeklySnapshot,
} from "./api-types";

/** A session token, or null to ask as a stranger. */
type Token = string | null;

type QueryValue = string | number | boolean | undefined;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: Token;
  body?: unknown;
  query?: Record<string, QueryValue>;
};

/** What the API says when it refuses: `{ error }`, sometimes a `code` to branch on. */
type ErrorBody = {
  error?: unknown;
  code?: unknown;
};

export type CatalogSortParam = "trending" | "top" | "new" | "upcoming";

export type LibraryQuery = {
  type?: MediaType;
  status?: TrackingStatus;
  q?: string;
  favorites?: boolean;
  sort?: LibrarySort;
  page?: number;
  pageSize?: number;
};

/**
 * A refusal from the API, with the sentence it sent for a person to read.
 * `code` is set when the app has something to do about it: "onboarding"
 * means the account has no username yet.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** What a dropped connection reads as: the phone's problem, said plainly. */
const OFFLINE_MESSAGE = "Mediary could not be reached. Check your connection and try again.";

let onUnauthorized: (() => void) | null = null;

/**
 * Who to tell when a request with a token comes back 401: the token was
 * refused, so the session is over. The root layout registers sign-out.
 */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

const queryString = (query: Record<string, QueryValue> | undefined): string => {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
};

const errorOf = async (response: Response): Promise<ApiError> => {
  const body: ErrorBody | null = await response.json().catch(() => null);
  const message =
    typeof body?.error === "string" ? body.error : "Something went wrong. Try again.";
  const code = typeof body?.code === "string" ? body.code : null;
  return new ApiError(response.status, message, code);
};

/** One request to /api/v1. Throws an ApiError with the API's own sentence on any refusal. */
const request = async <T>(path: string, { method = "GET", token, body, query }: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1${path}${queryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, OFFLINE_MESSAGE, "offline");
  }
  if (!response.ok) {
    if (response.status === 401 && token) {
      onUnauthorized?.();
    }
    throw await errorOf(response);
  }
  return (await response.json()) as T;
};

// ---- The catalog: public, a token only changes what reviews may be read.

export const fetchFeatures = () => request<FeatureFlags>("/features");

export const fetchShowcase = (sort: CatalogSortParam = "trending", perMedium = 10) =>
  request<CatalogShowcase>("/catalog/showcase", { query: { sort, perMedium } });

export const fetchCatalog = (query: { type?: MediaType; sort?: CatalogSortParam; genre?: string; page?: number }) =>
  request<Paginated<CatalogCard>>("/catalog", { query });

export const fetchGenres = (type?: MediaType) =>
  request<CatalogGenreCount[]>("/catalog/genres", { query: { type } });

export const searchCatalog = (query: { q: string; type?: MediaType; page?: number }) =>
  request<CatalogSearchResult>("/search", { query });

export const fetchTitle = (type: string, slug: string) =>
  request<TitleDetail>(`/titles/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`);

export const fetchRelated = (mediaUuid: string, type: MediaType) =>
  request<CatalogCard[]>(`/media/${mediaUuid}/related`, { query: { type } });

export const fetchCommunity = (mediaUuid: string) =>
  request<TitleCommunity>(`/media/${mediaUuid}/community`);

export const fetchReviews = (mediaUuid: string, token: Token) =>
  request<TitleReview[]>(`/media/${mediaUuid}/reviews`, { token });

export const fetchTracking = (mediaUuid: string, token: Token) =>
  request<TitleTracking>(`/media/${mediaUuid}/tracking`, { token });

// ---- The account.

export const fetchMe = (token: Token) => request<AuthUser>("/me", { token });

export const finishWelcome = (input: WelcomeInput, token: Token) =>
  request<AuthUser>("/me/welcome", { method: "POST", token, body: input });

export const checkUsername = (username: string, token: Token) =>
  request<{ available: boolean }>("/me/username/available", { token, query: { username } });

export const suggestUsername = (token: Token) =>
  request<{ username: string }>("/me/username/suggestion", { token });

export const fetchOwnProfile = (token: Token) => request<OwnProfile>("/me/profile", { token });

export const saveOwnProfile = (input: ProfileInput, token: Token) =>
  request<{ saved: true }>("/me/profile", { method: "PATCH", token, body: input });

// ---- The library and the sheet.

export const fetchLibrary = (query: LibraryQuery, token: Token) =>
  request<Paginated<LibraryItem>>("/library", { token, query });

export const fetchLibraryCounts = (token: Token, type?: MediaType) =>
  request<LibraryCounts>("/library/counts", { token, query: { type } });

export const fetchContinue = (token: Token) => request<LibraryItem[]>("/library/continue", { token });

export const saveEntry = (input: UpsertEntryInput, token: Token) =>
  request<TrackedEntry>("/entries", { method: "POST", token, body: input });

export const tickEntry = (entryUuid: string, delta: number, token: Token) =>
  request<TrackedEntry>(`/entries/${entryUuid}/progress`, { method: "POST", token, body: { delta } });

export const removeEntry = (entryUuid: string, token: Token) =>
  request<{ deleted: true }>(`/entries/${entryUuid}`, { method: "DELETE", token });

// ---- History, numbers and people.

export const fetchDiary = (page: number, token: Token) =>
  request<Paginated<DiaryLine>>("/diary", { token, query: { page, pageSize: 40 } });

export const fetchStats = (token: Token) => request<UserStats>("/stats", { token });

export const fetchWeek = (token: Token) => request<WeeklySnapshot>("/stats/week", { token });

export const fetchRecommendations = (token: Token) =>
  request<Recommendation[]>("/recommendations", { token });

export const fetchNotifications = (page: number, token: Token) =>
  request<Paginated<NotificationItem>>("/notifications", { token, query: { page } });

export const fetchUnread = (token: Token) => request<{ unread: number }>("/notifications/unread", { token });

export const markNotificationsRead = (token: Token) =>
  request<{ unread: 0 }>("/notifications/read", { method: "POST", token });

export const fetchFeed = (page: number, token: Token) =>
  request<Paginated<FeedItem>>("/feed", { token, query: { page } });

export const fetchProfile = (username: string, token: Token) =>
  request<PublicProfile>(`/profiles/${encodeURIComponent(username)}`, { token });

export const fetchProfileCounts = (username: string, token: Token) =>
  request<ProfileCounts>(`/profiles/${encodeURIComponent(username)}/counts`, { token });

export const fetchProfileFavorites = (username: string, token: Token) =>
  request<ProfileFavorite[]>(`/profiles/${encodeURIComponent(username)}/favorites`, { token });

export const fetchProfileActivity = (username: string, token: Token) =>
  request<DiaryLine[]>(`/profiles/${encodeURIComponent(username)}/activity`, { token });

export const followUser = (userUuid: string, token: Token) =>
  request<{ following: true }>("/follows", { method: "POST", token, body: { userUuid } });

export const unfollowUser = (userUuid: string, token: Token) =>
  request<{ following: false }>(`/follows/${userUuid}`, { method: "DELETE", token });

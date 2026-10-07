import { z } from "zod";
import { MediaStatus, MediaType } from "../../../../db/enum";
import { createThrottle, providerFetch } from "./http";
import {
  MediaProvider,
  NormalizedImage,
  NormalizedMedia,
  ProviderCandidate,
  ProviderListKind,
} from "./types";
import { OPENLIBRARY_SUBJECTS, popularityScore, toGenres } from "./vocabulary";

type SearchDoc = z.infer<typeof searchDocSchema>;

const API = "https://openlibrary.org";

/** How this source is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The book catalog";

/**
 * Covers are served by cover id at three sizes; the image loader swaps the
 * size letter for the width a slot needs. The stored size is the large one.
 */
export const BOOK_COVER_BASE = "https://covers.openlibrary.org/b/id";
const COVER_SIZE = "L";

/**
 * How many readers have the book on a shelf, for its very biggest titles.
 * See popularityScore.
 */
const POPULARITY_CEILING = 20_000;

/** Below this many ratings the average is noise, and no score is shown. */
const MIN_RATINGS = 10;

const PAGE_SIZE = 20;

/** The fields a search answers with; nothing else is fetched per title. */
const FIELDS = [
  "key",
  "title",
  "subtitle",
  "author_name",
  "first_publish_year",
  "cover_i",
  "subject",
  "number_of_pages_median",
  "ratings_average",
  "ratings_count",
  "readinglog_count",
  "publisher",
  "isbn",
].join(",");

// The catalog asks for a named User-Agent and a gentle pace; one request a
// second, one in flight, is what its documentation recommends.
const throttle = createThrottle({ minIntervalMs: 1000, maxConcurrent: 1 });

const USER_AGENT = "Mediary/0.1 (https://mediary.com)";

const nullableString = z.string().nullish().transform((value) => value || null);

const searchDocSchema = z.object({
  key: z.string(),
  title: z.string(),
  subtitle: nullableString,
  author_name: z.array(z.string()).nullish(),
  first_publish_year: z.number().nullish(),
  cover_i: z.number().nullish(),
  subject: z.array(z.string()).nullish(),
  number_of_pages_median: z.number().nullish(),
  ratings_average: z.number().nullish(),
  ratings_count: z.number().nullish(),
  readinglog_count: z.number().nullish(),
  publisher: z.array(z.string()).nullish(),
  isbn: z.array(z.string()).nullish(),
});

const searchSchema = z.object({ docs: z.array(searchDocSchema) });

const trendingSchema = z.object({ works: z.array(searchDocSchema) });

const workSchema = z.object({
  description: z.union([z.string(), z.object({ value: z.string() })]).nullish(),
});

const kindOf = (mediaType: MediaType): void => {
  if (mediaType !== "book") {
    throw new Error(`${SOURCE_LABEL} does not supply ${mediaType} titles`);
  }
};

const openLibraryFetch = async (path: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return providerFetch(
    `${API}${path}${suffix}`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
    { throttle, label: SOURCE_LABEL },
  );
};

/** A work's id as the catalog keys it: "OL893414W", from "/works/OL893414W". */
const workId = (key: string): string => key.replace(/^\/works\//, "");

/** A cover at the stored size, or none. */
export const bookCoverUrl = (coverId: number | null | undefined): string | null =>
  coverId ? `${BOOK_COVER_BASE}/${coverId}-${COVER_SIZE}.jpg` : null;

const toCandidate = (doc: SearchDoc): ProviderCandidate => ({
  provider: "openlibrary",
  mediaType: "book",
  externalId: workId(doc.key),
  title: doc.title,
  year: doc.first_publish_year ?? null,
  overview: doc.author_name?.[0] ?? null,
  posterUrl: bookCoverUrl(doc.cover_i),
});

/** The ISBN-13 among a work's editions, when it has one. */
const isbn13 = (doc: SearchDoc): string | null =>
  doc.isbn?.find((isbn) => /^\d{13}$/.test(isbn)) ?? null;

/**
 * A work in Mediary's shape, from its search record (which carries the
 * author, the counts and the subjects) and its own page (which carries
 * the description). Exported for the unit tests.
 */
export const normalizeOpenLibraryWork = (rawDoc: unknown, rawWork: unknown = null): NormalizedMedia => {
  const doc = searchDocSchema.parse(rawDoc);
  const work = rawWork === null ? null : workSchema.parse(rawWork);
  const readers = doc.readinglog_count ?? 0;
  const ratings = doc.ratings_count ?? 0;
  const average = doc.ratings_average;
  // The catalog sometimes holds a year of 0 for an undated work; that is no year.
  const year = doc.first_publish_year && doc.first_publish_year > 0 ? doc.first_publish_year : null;
  const status: MediaStatus = year === null ? "unknown" : year > new Date().getFullYear() ? "upcoming" : "released";
  const description = typeof work?.description === "string" ? work.description : (work?.description?.value ?? null);
  const cover = bookCoverUrl(doc.cover_i);
  const images: NormalizedImage[] = cover
    ? [{ imageType: "cover", url: cover, width: 500, height: 750, position: 0 }]
    : [];
  const isbn = isbn13(doc);
  const author = doc.author_name?.slice(0, 3).join(", ") ?? null;

  return {
    mediaType: "book",
    primaryRef: {
      provider: "openlibrary",
      externalId: workId(doc.key),
      externalUrl: `${API}/works/${workId(doc.key)}`,
    },
    otherRefs: [],
    canonicalTitle: doc.title,
    description: description?.slice(0, 4000) ?? null,
    releaseDate: year === null ? null : `${year}-01-01`,
    endDate: null,
    status,
    adult: false,
    popularity: popularityScore(readers, POPULARITY_CEILING),
    popularitySignals: { openLibraryReaders: readers, openLibraryRatings: ratings },
    // The catalog rates out of five; Mediary's scale is ten.
    providerScore: average !== null && average !== undefined && ratings >= MIN_RATINGS ? Math.round(average * 20) / 10 : null,
    titles: [
      { title: doc.title, titleType: "canonical", language: null },
      ...(doc.subtitle ? [{ title: `${doc.title}: ${doc.subtitle}`, titleType: "alias" as const, language: null }] : []),
      ...(author ? [{ title: `${doc.title} by ${author}`, titleType: "alias" as const, language: null }] : []),
    ],
    images,
    genres: toGenres((doc.subject ?? []).flatMap((subject) => OPENLIBRARY_SUBJECTS[subject.toLowerCase()] ?? [])),
    platforms: [],
    details: {
      kind: "book",
      author: author?.slice(0, 200) ?? null,
      pageCount: doc.number_of_pages_median ?? null,
      publisher: doc.publisher?.[0]?.slice(0, 160) ?? null,
      isbn13: isbn,
    },
  };
};

/** The search for one work by its key. */
const findDoc = async (id: string): Promise<SearchDoc> => {
  const data = searchSchema.parse(
    await openLibraryFetch("/search.json", { q: `key:/works/${id}`, fields: FIELDS, limit: "1" }),
  );
  const doc = data.docs[0];
  if (!doc) {
    throw new Error(`${SOURCE_LABEL} has no work ${id}`);
  }
  return doc;
};

/**
 * The catalog's lists. "Trending" is its own weekly chart; "popular" is
 * the most shelved books in English; "highest rated" the best averages
 * among them; "coming soon" the most shelved among this year's and next
 * year's publications.
 */
const listRequest = (kind: ProviderListKind, page: number): { path: string; params: Record<string, string> } => {
  const year = new Date().getFullYear();
  const paged = { fields: FIELDS, limit: String(PAGE_SIZE), page: String(page) };
  switch (kind) {
    case "trending":
      return { path: "/trending/weekly.json", params: { limit: String(PAGE_SIZE), page: String(page) } };
    case "popular":
      return { path: "/search.json", params: { q: "language:eng", sort: "readinglog", ...paged } };
    case "top":
      return { path: "/search.json", params: { q: "language:eng", sort: "rating", ...paged } };
    case "upcoming":
      return { path: "/search.json", params: { q: `first_publish_year:[${year} TO ${year + 1}]`, sort: "readinglog", ...paged } };
  }
};

/**
 * Open Library: books as works, with covers from its cover service. Open
 * data, no key; a named User-Agent and one request a second are its
 * conditions (docs/catalog-providers.md).
 */
export const openLibraryProvider: MediaProvider = {
  provider: "openlibrary",
  mediaTypes: ["book"],
  attribution: {
    provider: "openlibrary",
    name: "Open Library",
    text: "Book data and covers from Open Library.",
    url: "https://openlibrary.org/",
    logoPath: null,
  },
  isConfigured: () => true,
  search: async (mediaType, query, page = 1) => {
    kindOf(mediaType);
    const data = searchSchema.parse(
      await openLibraryFetch("/search.json", { q: query, fields: FIELDS, limit: String(PAGE_SIZE), page: String(page) }),
    );
    return data.docs.map(toCandidate);
  },
  getById: async (mediaType, externalId) => {
    kindOf(mediaType);
    const [doc, work] = await Promise.all([findDoc(externalId), openLibraryFetch(`/works/${externalId}.json`)]);
    return normalizeOpenLibraryWork(doc, work);
  },
  getList: async (mediaType, kind, page = 1) => {
    kindOf(mediaType);
    const request = listRequest(kind, page);
    const raw = await openLibraryFetch(request.path, request.params);
    const docs = kind === "trending" ? trendingSchema.parse(raw).works : searchSchema.parse(raw).docs;
    return docs.map(toCandidate);
  },
};

import { describe, expect, it } from "vitest";
import { normalizeOpenLibraryWork } from "./openlibrary";

// Trimmed from the catalog's search record and work page for Dune, fetched on 2026-10-07.
const DOC = {
  key: "/works/OL893414W",
  title: "Dune",
  author_name: ["Frank Herbert"],
  first_publish_year: 1965,
  cover_i: 11481354,
  subject: ["Dune (Imaginary place)", "Fiction", "Fiction, science fiction, general", "Science fiction", "Adventure fiction"],
  number_of_pages_median: 608,
  ratings_average: 4.3049326,
  ratings_count: 446,
  readinglog_count: 4402,
  publisher: ["Gollancz", "Ace"],
  isbn: ["044100590X", "9780441013593"],
};

const WORK = {
  description: { value: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides." },
};

describe("Open Library normalization", () => {
  it("maps a work into Mediary's shape with its author, pages, cover, genres and score", () => {
    const book = normalizeOpenLibraryWork(DOC, WORK);
    expect(book).toMatchObject({
      mediaType: "book",
      primaryRef: { provider: "openlibrary", externalId: "OL893414W", externalUrl: "https://openlibrary.org/works/OL893414W" },
      canonicalTitle: "Dune",
      description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.",
      releaseDate: "1965-01-01",
      status: "released",
      providerScore: 8.6,
      genres: [
        { slug: "literary-fiction", name: "Literary fiction" },
        { slug: "science-fiction", name: "Science fiction" },
        { slug: "adventure", name: "Adventure" },
      ],
      details: { kind: "book", author: "Frank Herbert", pageCount: 608, publisher: "Gollancz", isbn13: "9780441013593" },
    });
    expect(book.images[0]?.url).toBe("https://covers.openlibrary.org/b/id/11481354-L.jpg");
    expect(book.titles.map((entry) => entry.title)).toEqual(["Dune", "Dune by Frank Herbert"]);
  });

  it("reads a plain description, withholds a thin score, and copes without a cover or a year", () => {
    const book = normalizeOpenLibraryWork(
      { ...DOC, cover_i: null, first_publish_year: null, ratings_count: 3, isbn: [], publisher: [] },
      { description: "Plain words." },
    );
    expect(book.description).toBe("Plain words.");
    expect(book.providerScore).toBeNull();
    expect(book.images).toEqual([]);
    expect(book.releaseDate).toBeNull();
    expect(book.status).toBe("unknown");
    expect(book.details).toMatchObject({ publisher: null, isbn13: null });
    expect(normalizeOpenLibraryWork({ ...DOC, first_publish_year: 0 }).releaseDate).toBeNull();
  });
});

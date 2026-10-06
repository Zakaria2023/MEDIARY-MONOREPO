import { CatalogSort, HubFacetKind } from "services";
import { LaunchMediaType } from "@/db/enum";

/** One of a hub's two rails: its heading and how it is listed. */
export type HubRail = {
  heading: string;
  reason: string;
  sort: CatalogSort;
};

/** The words and the shape of one medium's hub. */
export type HubCopy = {
  heading: string;
  /** The line under the heading. */
  intro: string;
  /** The meta description. */
  description: string;
  /** The plural noun for sentences: "records". */
  noun: string;
  /** The medium's own filter beside genres. */
  facet: { kind: HubFacetKind; label: string };
  rails: [HubRail, HubRail];
  /** What a member's section is called: "Your anime". */
  mine: string;
};

/**
 * EACH MEDIUM'S HUB, in its own words. The rails and the facet are what make
 * one hub different from the next: anime is lived by season, games by
 * platform, movies by decade, TV by whether it is still airing, music by
 * the kind of record. The design around them is shared.
 */
export const HUB_COPY: Record<LaunchMediaType, HubCopy> = {
  anime: {
    heading: "Anime",
    intro: "This season's shows, the classics, and what everyone is starting this week.",
    description:
      "Discover anime by season and genre: what is airing now, the highest rated ever, and what is coming. Track every episode on Mediary.",
    noun: "anime",
    facet: { kind: "season", label: "Season" },
    rails: [
      { heading: "Airing and trending", reason: "What people are watching this week.", sort: "trending" },
      { heading: "New this season", reason: "The latest premieres, newest first.", sort: "new" },
    ],
    mine: "Your anime",
  },
  game: {
    heading: "Games",
    intro: "What people are playing, by platform, and what is coming next.",
    description:
      "Discover video games by platform and genre: trending, top rated and upcoming on PC, PlayStation, Xbox and Switch. Track your backlog and hours on Mediary.",
    noun: "games",
    facet: { kind: "platform", label: "Platform" },
    rails: [
      { heading: "Being played now", reason: "The most played this week.", sort: "trending" },
      { heading: "Coming soon", reason: "Release dates ahead, nearest first.", sort: "upcoming" },
    ],
    mine: "Your games",
  },
  movie: {
    heading: "Movies",
    intro: "This week's most watched, the all-time best, and what opens soon.",
    description:
      "Discover movies by decade and genre: trending, top rated and in cinemas soon. Keep a film diary and rate what you watch on Mediary.",
    noun: "movies",
    facet: { kind: "decade", label: "Decade" },
    rails: [
      { heading: "Most watched this week", reason: "What people are putting on.", sort: "trending" },
      { heading: "Highest rated", reason: "The best ever made, by community score.", sort: "top" },
    ],
    mine: "Your movies",
  },
  tv: {
    heading: "TV shows",
    intro: "What is airing now, the series that ended well, and new seasons on the way.",
    description:
      "Discover TV shows: airing now, ended, and coming back. Track every season and episode you watch on Mediary.",
    noun: "shows",
    facet: { kind: "status", label: "Airing" },
    rails: [
      { heading: "Airing now", reason: "The series people are keeping up with.", sort: "trending" },
      { heading: "New seasons", reason: "Latest premieres and returns.", sort: "new" },
    ],
    mine: "Your shows",
  },
  music: {
    heading: "Music",
    intro: "New records, the ones everyone keeps playing, and what is coming.",
    description:
      "Discover new albums and EPs by genre, keep a listening diary, rate records and build a collection on Mediary.",
    noun: "records",
    facet: { kind: "releaseType", label: "Type" },
    rails: [
      { heading: "New releases", reason: "Out in the last few weeks.", sort: "new" },
      { heading: "Most rated", reason: "The records people keep coming back to.", sort: "top" },
    ],
    mine: "Your music",
  },
};

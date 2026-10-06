import { CatalogSort } from "services";
import { LaunchMediaType } from "@/db/enum";

type ExploreCopy = {
  /** The page's h1. */
  heading: string;
  /** The line under it. */
  intro: string;
  /** The meta description: what a search result shows. */
  description: string;
  /** The one plural noun, lowercase, for sentences: "movies". */
  noun: string;
};

/**
 * The words on each medium's discovery page. Written for a person first and
 * a search result second: each description says what the page lets someone
 * do, in the terms they would search for.
 */
export const EXPLORE_COPY: Record<LaunchMediaType, ExploreCopy> = {
  anime: {
    heading: "Anime",
    intro: "Seasonal hits, classics and what everyone is starting this week.",
    description:
      "Discover trending, top rated and upcoming anime. Track every episode you watch and share your anime taste on Mediary.",
    noun: "anime",
  },
  game: {
    heading: "Games",
    intro: "What people are playing, the best rated, and what is coming next.",
    description:
      "Discover trending, top rated and upcoming video games across PC, PlayStation, Xbox and Switch. Track your backlog and hours on Mediary.",
    noun: "games",
  },
  movie: {
    heading: "Movies",
    intro: "This week's most watched, the all-time best, and what opens soon.",
    description:
      "Discover trending, top rated and upcoming movies. Keep a film diary, rate what you watch and build your watchlist on Mediary.",
    noun: "movies",
  },
  tv: {
    heading: "TV shows",
    intro: "The series everyone is watching, the best ever made, and new seasons.",
    description:
      "Discover trending, top rated and upcoming TV shows. Track every season and episode you watch on Mediary.",
    noun: "shows",
  },
};

/** The sort tabs, in order, with what each one shows. */
export const SORT_LABELS: Record<CatalogSort, string> = {
  trending: "Trending",
  top: "Top rated",
  new: "New releases",
  upcoming: "Coming soon",
};

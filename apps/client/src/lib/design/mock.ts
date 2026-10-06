// STATIC DATA FOR THE STEP 0 PROTOTYPES. Nothing here reaches a database or a
// provider; the screens under /design render these so the layout, the
// hierarchy and the motion can be judged before the catalog exists. Delete
// this folder when the real services replace it.

export type MockMediaType = "anime" | "game" | "movie" | "tv";

export type MockStatus =
  | "in_progress"
  | "completed"
  | "paused"
  | "dropped"
  | "planned";

export type MockTitle = {
  slug: string;
  type: MockMediaType;
  title: string;
  year: number;
  /** The poster's dominant color; the placeholder art is painted from it. */
  color: string;
  /** Community score, 0 to 10. */
  score: number;
  genres: string[];
  /** What a card's second line says: "24 episodes", "Open world", "2h 49m". */
  meta: string;
};

export type MockEntry = {
  title: MockTitle;
  status: MockStatus;
  score: number | null;
  progress: number;
  total: number | null;
  unit: "episodes" | "hours" | "percent";
  platform?: string;
  updatedAt: string;
};

export type MockDiaryLine = {
  date: string;
  kind: "progress" | "completed" | "started" | "rated";
  title: MockTitle;
  detail: string;
};

export type MockActivity = {
  user: MockUser;
  verb: string;
  title: MockTitle;
  when: string;
};

export type MockUser = {
  username: string;
  displayName: string;
  initials: string;
  color: string;
};

export const MEDIA_TYPE_LABEL: Record<MockMediaType, string> = {
  anime: "Anime",
  game: "Game",
  movie: "Movie",
  tv: "TV",
};

export const STATUS_LABEL: Record<MockMediaType, Record<MockStatus, string>> = {
  anime: {
    in_progress: "Watching",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Watch",
  },
  tv: {
    in_progress: "Watching",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Watch",
  },
  movie: {
    in_progress: "Watching",
    completed: "Watched",
    paused: "Paused",
    dropped: "Dropped",
    planned: "Watchlist",
  },
  game: {
    in_progress: "Playing",
    completed: "Completed",
    paused: "On Hold",
    dropped: "Dropped",
    planned: "Plan to Play",
  },
};

const t = (
  slug: string,
  type: MockMediaType,
  title: string,
  year: number,
  color: string,
  score: number,
  genres: string[],
  meta: string,
): MockTitle => ({ slug, type, title, year, color, score, genres, meta });

export const TITLES: MockTitle[] = [
  t("attack-on-titan", "anime", "Attack on Titan", 2013, "#7a2b2b", 9.0, ["Action", "Drama"], "87 episodes"),
  t("elden-ring", "game", "Elden Ring", 2022, "#8a6a2a", 9.4, ["RPG", "Open World"], "PS5, PC, Xbox"),
  t("interstellar", "movie", "Interstellar", 2014, "#2a4a6a", 8.7, ["Sci-Fi", "Drama"], "2h 49m"),
  t("breaking-bad", "tv", "Breaking Bad", 2008, "#3a5a2a", 9.5, ["Crime", "Drama"], "5 seasons"),
  t("cyberpunk-2077", "game", "Cyberpunk 2077", 2020, "#b8b02a", 8.1, ["RPG", "Sci-Fi"], "PC, PS5, Xbox"),
  t("frieren", "anime", "Frieren: Beyond Journey's End", 2023, "#3a6a7a", 9.2, ["Fantasy", "Adventure"], "28 episodes"),
  t("dune-part-two", "movie", "Dune: Part Two", 2024, "#9a6a3a", 8.6, ["Sci-Fi", "Adventure"], "2h 46m"),
  t("severance", "tv", "Severance", 2022, "#2a6a6a", 8.8, ["Thriller", "Sci-Fi"], "2 seasons"),
  t("hades-ii", "game", "Hades II", 2025, "#5a2a7a", 9.1, ["Roguelike", "Action"], "PC, Switch"),
  t("vinland-saga", "anime", "Vinland Saga", 2019, "#4a4a5a", 8.9, ["Action", "Historical"], "48 episodes"),
  t("the-bear", "tv", "The Bear", 2022, "#7a3a2a", 8.6, ["Drama", "Comedy"], "4 seasons"),
  t("spirited-away", "movie", "Spirited Away", 2001, "#2a5a4a", 8.6, ["Fantasy", "Animation"], "2h 5m"),
  t("death-note", "anime", "Death Note", 2006, "#1a1a2a", 8.6, ["Thriller", "Mystery"], "37 episodes"),
  t("baldurs-gate-3", "game", "Baldur's Gate 3", 2023, "#6a2a3a", 9.6, ["RPG", "Fantasy"], "PC, PS5, Xbox"),
  t("oppenheimer", "movie", "Oppenheimer", 2023, "#4a3a2a", 8.4, ["Biography", "Drama"], "3h 0m"),
  t("arcane", "tv", "Arcane", 2021, "#2a3a7a", 9.0, ["Animation", "Action"], "2 seasons"),
  t("chainsaw-man", "anime", "Chainsaw Man", 2022, "#8a2a2a", 8.5, ["Action", "Horror"], "12 episodes"),
  t("hollow-knight-silksong", "game", "Hollow Knight: Silksong", 2025, "#2a2a4a", 9.3, ["Metroidvania", "Action"], "PC, Switch, PS5"),
];

export const byType = (type: MockMediaType): MockTitle[] =>
  TITLES.filter((title) => title.type === type);

export const find = (slug: string): MockTitle => {
  const title = TITLES.find((entry) => entry.slug === slug);
  if (!title) {
    throw new Error(`No mock title ${slug}`);
  }
  return title;
};

export const ME: MockUser = {
  username: "zakaria",
  displayName: "Zakaria",
  initials: "ZA",
  color: "#4057ff",
};

export const FRIENDS: MockUser[] = [
  { username: "ahmad", displayName: "Ahmad", initials: "AH", color: "#7b2cff" },
  { username: "lina", displayName: "Lina", initials: "LI", color: "#1697ff" },
  { username: "omar", displayName: "Omar", initials: "OM", color: "#ff2c8a" },
  { username: "sara", displayName: "Sara", initials: "SA", color: "#d815ff" },
];

export const CONTINUE: MockEntry[] = [
  { title: find("frieren"), status: "in_progress", score: null, progress: 19, total: 28, unit: "episodes", updatedAt: "Today" },
  { title: find("elden-ring"), status: "in_progress", score: 9, progress: 44, total: null, unit: "hours", platform: "PS5", updatedAt: "Yesterday" },
  { title: find("severance"), status: "in_progress", score: null, progress: 6, total: 19, unit: "episodes", updatedAt: "2 days ago" },
  { title: find("hades-ii"), status: "in_progress", score: null, progress: 12, total: null, unit: "hours", platform: "PC", updatedAt: "3 days ago" },
  { title: find("vinland-saga"), status: "paused", score: 8, progress: 30, total: 48, unit: "episodes", updatedAt: "Last week" },
];

export const LIBRARY: MockEntry[] = [
  ...CONTINUE,
  { title: find("attack-on-titan"), status: "completed", score: 10, progress: 87, total: 87, unit: "episodes", updatedAt: "Oct 5" },
  { title: find("interstellar"), status: "completed", score: 9, progress: 100, total: 100, unit: "percent", updatedAt: "Oct 4" },
  { title: find("breaking-bad"), status: "completed", score: 10, progress: 62, total: 62, unit: "episodes", updatedAt: "Sep 28" },
  { title: find("cyberpunk-2077"), status: "in_progress", score: null, progress: 6, total: null, unit: "hours", platform: "PC", updatedAt: "Oct 3" },
  { title: find("dune-part-two"), status: "planned", score: null, progress: 0, total: 100, unit: "percent", updatedAt: "Sep 20" },
  { title: find("baldurs-gate-3"), status: "completed", score: 10, progress: 112, total: null, unit: "hours", platform: "PC", updatedAt: "Aug 30" },
  { title: find("the-bear"), status: "dropped", score: 6, progress: 4, total: 38, unit: "episodes", updatedAt: "Aug 12" },
  { title: find("arcane"), status: "completed", score: 9, progress: 18, total: 18, unit: "episodes", updatedAt: "Jul 19" },
  { title: find("death-note"), status: "completed", score: 9, progress: 37, total: 37, unit: "episodes", updatedAt: "Jun 2" },
  { title: find("hollow-knight-silksong"), status: "planned", score: null, progress: 0, total: null, unit: "hours", updatedAt: "Sep 30" },
  { title: find("oppenheimer"), status: "completed", score: 8, progress: 100, total: 100, unit: "percent", updatedAt: "May 14" },
];

export const DIARY: MockDiaryLine[] = [
  { date: "Oct 6", kind: "progress", title: find("elden-ring"), detail: "+2h, now 44h" },
  { date: "Oct 6", kind: "progress", title: find("frieren"), detail: "Episode 18 to 19" },
  { date: "Oct 5", kind: "completed", title: find("attack-on-titan"), detail: "Rated 10" },
  { date: "Oct 4", kind: "completed", title: find("interstellar"), detail: "Rated 9" },
  { date: "Oct 3", kind: "started", title: find("cyberpunk-2077"), detail: "On PC" },
  { date: "Oct 1", kind: "rated", title: find("severance"), detail: "Rated 9" },
  { date: "Sep 28", kind: "completed", title: find("breaking-bad"), detail: "Rated 10, second time through" },
];

export const FEED: MockActivity[] = [
  { user: FRIENDS[0]!, verb: "completed", title: find("arcane"), when: "2h" },
  { user: FRIENDS[1]!, verb: "started", title: find("frieren"), when: "5h" },
  { user: FRIENDS[2]!, verb: "rated 9", title: find("dune-part-two"), when: "1d" },
  { user: FRIENDS[3]!, verb: "added to a list", title: find("hades-ii"), when: "2d" },
];

/** Taste DNA for the profile and the comparison. */
export const TASTE: { label: string; value: number }[] = [
  { label: "Story-driven", value: 91 },
  { label: "Sci-Fi", value: 84 },
  { label: "Dark", value: 82 },
  { label: "Emotional", value: 77 },
  { label: "Fantasy", value: 75 },
  { label: "Comedy", value: 48 },
  { label: "Competitive", value: 35 },
];

export const COMPARISON = {
  overall: 87,
  byType: [
    { type: "anime" as const, value: 93 },
    { type: "game" as const, value: 91 },
    { type: "tv" as const, value: 84 },
    { type: "movie" as const, value: 79 },
  ],
  shared: [find("attack-on-titan"), find("elden-ring"), find("interstellar"), find("breaking-bad")],
  theyLove: [find("hades-ii"), find("the-bear")],
  youLove: [find("frieren"), find("severance")],
};

/** Twelve months of completions, for the stats chart. */
export const MONTHLY: { month: string; anime: number; game: number; movie: number; tv: number }[] = [
  { month: "Nov", anime: 2, game: 1, movie: 3, tv: 1 },
  { month: "Dec", anime: 3, game: 0, movie: 5, tv: 2 },
  { month: "Jan", anime: 1, game: 2, movie: 2, tv: 1 },
  { month: "Feb", anime: 2, game: 1, movie: 1, tv: 0 },
  { month: "Mar", anime: 4, game: 1, movie: 2, tv: 2 },
  { month: "Apr", anime: 1, game: 0, movie: 4, tv: 1 },
  { month: "May", anime: 2, game: 2, movie: 3, tv: 0 },
  { month: "Jun", anime: 3, game: 1, movie: 1, tv: 2 },
  { month: "Jul", anime: 1, game: 1, movie: 2, tv: 1 },
  { month: "Aug", anime: 2, game: 2, movie: 3, tv: 1 },
  { month: "Sep", anime: 3, game: 0, movie: 2, tv: 2 },
  { month: "Oct", anime: 1, game: 1, movie: 1, tv: 0 },
];

export const RATING_DISTRIBUTION: number[] = [0, 0, 1, 2, 3, 6, 12, 24, 31, 19, 9];

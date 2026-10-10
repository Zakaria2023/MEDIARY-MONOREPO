import { NormalizedGenre } from "./types";

/**
 * MEDIARY'S GENRE VOCABULARY. One list across media, so "Science fiction" on
 * a movie and on a game is the same filter. Adapters map their provider's
 * genres onto these slugs; a provider genre with no entry here is dropped
 * rather than invented, so the vocabulary only grows on purpose.
 */
export const GENRES: Record<string, string> = {
  action: "Action",
  adventure: "Adventure",
  animation: "Animation",
  comedy: "Comedy",
  crime: "Crime",
  documentary: "Documentary",
  drama: "Drama",
  family: "Family",
  fantasy: "Fantasy",
  history: "History",
  horror: "Horror",
  music: "Music",
  mystery: "Mystery",
  romance: "Romance",
  "science-fiction": "Science fiction",
  thriller: "Thriller",
  war: "War",
  western: "Western",
  kids: "Kids",
  reality: "Reality",
  politics: "Politics",
  "talk-show": "Talk show",
  soap: "Soap",
  news: "News",
  "tv-movie": "TV movie",
  rpg: "Role-playing",
  shooter: "Shooter",
  platformer: "Platformer",
  puzzle: "Puzzle",
  racing: "Racing",
  sports: "Sports",
  strategy: "Strategy",
  simulation: "Simulation",
  fighting: "Fighting",
  indie: "Indie",
  arcade: "Arcade",
  "card-and-board": "Card and board",
  "point-and-click": "Point and click",
  "hack-and-slash": "Hack and slash",
  tactical: "Tactical",
  "visual-novel": "Visual novel",
  moba: "MOBA",
  survival: "Survival",
  stealth: "Stealth",
  sandbox: "Sandbox",
  "open-world": "Open world",
  party: "Party",
  rock: "Rock",
  pop: "Pop",
  "hip-hop": "Hip hop",
  electronic: "Electronic",
  house: "House",
  techno: "Techno",
  ambient: "Ambient",
  jazz: "Jazz",
  classical: "Classical",
  metal: "Metal",
  punk: "Punk",
  folk: "Folk",
  country: "Country",
  blues: "Blues",
  soul: "Soul",
  "r-and-b": "R&B",
  funk: "Funk",
  reggae: "Reggae",
  latin: "Latin",
  "k-pop": "K-pop",
  "j-pop": "J-pop",
  soundtrack: "Soundtrack",
  experimental: "Experimental",
  "slice-of-life": "Slice of life",
  supernatural: "Supernatural",
  mecha: "Mecha",
  psychological: "Psychological",
  isekai: "Isekai",
  shounen: "Shounen",
  shoujo: "Shoujo",
  seinen: "Seinen",
  josei: "Josei",
  harem: "Harem",
  ecchi: "Ecchi",
  magic: "Magic",
  school: "School",
  military: "Military",
  "martial-arts": "Martial arts",
  space: "Space",
  nonfiction: "Nonfiction",
  biography: "Biography",
  "self-help": "Self-help",
  poetry: "Poetry",
  philosophy: "Philosophy",
  business: "Business",
  science: "Science",
  "young-adult": "Young adult",
  "graphic-novel": "Graphic novel",
  classics: "Classics",
  "literary-fiction": "Literary fiction",
  humor: "Humor",
  travel: "Travel",
  cooking: "Cooking",
  religion: "Religion",
};

/**
 * The book catalog's subject headings onto the vocabulary. Subjects are
 * free text from library records, so the common ones are listed in the
 * form they take; a heading with no entry is dropped.
 */
export const OPENLIBRARY_SUBJECTS: Record<string, string[]> = {
  fiction: ["literary-fiction"],
  "literary fiction": ["literary-fiction"],
  "science fiction": ["science-fiction"],
  "fiction, science fiction, general": ["science-fiction"],
  "american science fiction": ["science-fiction"],
  fantasy: ["fantasy"],
  "fantasy fiction": ["fantasy"],
  "fiction, fantasy, general": ["fantasy"],
  "fiction, fantasy, epic": ["fantasy"],
  romance: ["romance"],
  "fiction, romance, general": ["romance"],
  "love stories": ["romance"],
  mystery: ["mystery"],
  "mystery fiction": ["mystery"],
  "detective and mystery stories": ["mystery"],
  "fiction, mystery & detective, general": ["mystery"],
  thriller: ["thriller"],
  thrillers: ["thriller"],
  "fiction, thrillers, general": ["thriller"],
  suspense: ["thriller"],
  horror: ["horror"],
  "horror fiction": ["horror"],
  "fiction, horror": ["horror"],
  history: ["history"],
  "historical fiction": ["history"],
  "fiction, historical, general": ["history"],
  biography: ["biography", "nonfiction"],
  "biography & autobiography": ["biography", "nonfiction"],
  autobiography: ["biography", "nonfiction"],
  memoir: ["biography", "nonfiction"],
  "self-help": ["self-help", "nonfiction"],
  "self-help techniques": ["self-help", "nonfiction"],
  "self-actualization (psychology)": ["self-help", "nonfiction"],
  "success": ["self-help", "nonfiction"],
  psychology: ["science", "nonfiction"],
  poetry: ["poetry"],
  philosophy: ["philosophy", "nonfiction"],
  business: ["business", "nonfiction"],
  "business & economics": ["business", "nonfiction"],
  economics: ["business", "nonfiction"],
  science: ["science", "nonfiction"],
  "popular science": ["science", "nonfiction"],
  "juvenile fiction": ["kids"],
  "children's fiction": ["kids"],
  "children's stories": ["kids"],
  "young adult fiction": ["young-adult"],
  "juvenile literature": ["kids", "nonfiction"],
  "graphic novels": ["graphic-novel"],
  "comics & graphic novels": ["graphic-novel"],
  "comic books, strips, etc": ["graphic-novel"],
  "comic books, strips, etc.": ["graphic-novel"],
  superheroes: ["action"],
  "superhero comic books, strips, etc.": ["action", "graphic-novel"],
  classics: ["classics"],
  "classic literature": ["classics"],
  humor: ["humor"],
  "humorous fiction": ["humor"],
  "fiction, humorous": ["humor"],
  travel: ["travel", "nonfiction"],
  cooking: ["cooking", "nonfiction"],
  cookbooks: ["cooking", "nonfiction"],
  religion: ["religion", "nonfiction"],
  war: ["war"],
  "war stories": ["war"],
  adventure: ["adventure"],
  "adventure stories": ["adventure"],
  "adventure fiction": ["adventure"],
  "crime": ["crime"],
  "crime fiction": ["crime"],
  "fiction, crime": ["crime"],
  drama: ["drama"],
  "fiction, general": ["literary-fiction"],
  "fiction, psychological": ["psychological"],
  "psychological fiction": ["psychological"],
  "fiction, coming of age": ["drama"],
  "dystopias": ["science-fiction"],
  "dystopian fiction": ["science-fiction"],
  "space opera": ["science-fiction", "space"],
};

/**
 * The anime catalog's category titles onto the vocabulary. It files one
 * title under many categories, from genre to setting; only the ones a
 * person would filter by are kept, and a title with no entry is dropped.
 */
export const KITSU_CATEGORIES: Record<string, string[]> = {
  action: ["action"],
  adventure: ["adventure"],
  comedy: ["comedy"],
  drama: ["drama"],
  fantasy: ["fantasy"],
  horror: ["horror"],
  mystery: ["mystery"],
  romance: ["romance"],
  "science fiction": ["science-fiction"],
  "sci-fi": ["science-fiction"],
  thriller: ["thriller"],
  "slice of life": ["slice-of-life"],
  supernatural: ["supernatural"],
  mecha: ["mecha"],
  psychological: ["psychological"],
  isekai: ["isekai"],
  shounen: ["shounen"],
  shoujo: ["shoujo"],
  seinen: ["seinen"],
  josei: ["josei"],
  harem: ["harem"],
  ecchi: ["ecchi"],
  magic: ["magic"],
  school: ["school"],
  "school life": ["school"],
  military: ["military"],
  "martial arts": ["martial-arts"],
  space: ["space"],
  sports: ["sports"],
  music: ["music"],
  historical: ["history"],
  kids: ["kids"],
  crime: ["crime"],
  war: ["war"],
  family: ["family"],
  documentary: ["documentary"],
  police: ["crime"],
};

/**
 * The music catalog's genre and tag names onto the vocabulary. Its names are
 * free text its members agreed on, so the common spellings are listed; a
 * name with no entry is dropped.
 */
export const MUSICBRAINZ_GENRES: Record<string, string[]> = {
  rock: ["rock"],
  "alternative rock": ["rock", "indie"],
  "indie rock": ["rock", "indie"],
  "hard rock": ["rock"],
  "progressive rock": ["rock"],
  "psychedelic rock": ["rock"],
  pop: ["pop"],
  "synth-pop": ["pop", "electronic"],
  synthpop: ["pop", "electronic"],
  "dance-pop": ["pop"],
  "indie pop": ["pop", "indie"],
  "hip hop": ["hip-hop"],
  "hip-hop": ["hip-hop"],
  rap: ["hip-hop"],
  trap: ["hip-hop"],
  electronic: ["electronic"],
  electronica: ["electronic"],
  edm: ["electronic"],
  house: ["house", "electronic"],
  "deep house": ["house", "electronic"],
  techno: ["techno", "electronic"],
  trance: ["electronic"],
  "drum and bass": ["electronic"],
  dubstep: ["electronic"],
  ambient: ["ambient", "electronic"],
  idm: ["electronic", "experimental"],
  jazz: ["jazz"],
  "jazz fusion": ["jazz"],
  classical: ["classical"],
  "contemporary classical": ["classical"],
  metal: ["metal"],
  "heavy metal": ["metal"],
  "death metal": ["metal"],
  "black metal": ["metal"],
  "thrash metal": ["metal"],
  "progressive metal": ["metal"],
  punk: ["punk"],
  "punk rock": ["punk", "rock"],
  "pop punk": ["punk", "pop"],
  "post-punk": ["punk"],
  folk: ["folk"],
  "indie folk": ["folk", "indie"],
  "folk rock": ["folk", "rock"],
  country: ["country"],
  blues: ["blues"],
  soul: ["soul"],
  "neo-soul": ["soul"],
  "r&b": ["r-and-b"],
  "contemporary r&b": ["r-and-b"],
  "rhythm and blues": ["r-and-b"],
  funk: ["funk"],
  disco: ["funk", "pop"],
  reggae: ["reggae"],
  dancehall: ["reggae"],
  latin: ["latin"],
  reggaeton: ["latin"],
  "latin pop": ["latin", "pop"],
  "k-pop": ["k-pop", "pop"],
  "j-pop": ["j-pop", "pop"],
  soundtrack: ["soundtrack"],
  "film score": ["soundtrack"],
  "video game music": ["soundtrack"],
  experimental: ["experimental"],
  "art pop": ["pop", "experimental"],
  indie: ["indie"],
};

/** Genre slugs to the vocabulary entries, dropping any the vocabulary lacks. */
export const toGenres = (slugs: string[]): NormalizedGenre[] => {
  const seen = new Set<string>();
  const genres: NormalizedGenre[] = [];
  for (const slug of slugs) {
    const name = GENRES[slug];
    if (name && !seen.has(slug)) {
      seen.add(slug);
      genres.push({ slug, name });
    }
  }
  return genres;
};

/**
 * TMDB genre ids, movies and TV together (the two lists share the ids they
 * have in common). The combined TV genres split into both of Mediary's.
 */
export const TMDB_GENRES: Record<number, string[]> = {
  28: ["action"],
  12: ["adventure"],
  16: ["animation"],
  35: ["comedy"],
  80: ["crime"],
  99: ["documentary"],
  18: ["drama"],
  10751: ["family"],
  14: ["fantasy"],
  36: ["history"],
  27: ["horror"],
  10402: ["music"],
  9648: ["mystery"],
  10749: ["romance"],
  878: ["science-fiction"],
  10770: ["tv-movie"],
  53: ["thriller"],
  10752: ["war"],
  37: ["western"],
  10759: ["action", "adventure"],
  10762: ["kids"],
  10763: ["news"],
  10764: ["reality"],
  10765: ["science-fiction", "fantasy"],
  10766: ["soap"],
  10767: ["talk-show"],
  10768: ["war", "politics"],
};

/**
 * IGDB genre and theme slugs. IGDB splits what a player would call a genre
 * across two lists (genres are mechanics, themes are subject matter), and
 * Mediary's vocabulary takes from both.
 */
export const IGDB_GENRES: Record<string, string[]> = {
  "role-playing-rpg": ["rpg"],
  shooter: ["shooter"],
  platform: ["platformer"],
  puzzle: ["puzzle"],
  racing: ["racing"],
  sport: ["sports"],
  "real-time-strategy-rts": ["strategy"],
  "turn-based-strategy-tbs": ["strategy"],
  strategy: ["strategy"],
  simulator: ["simulation"],
  fighting: ["fighting"],
  indie: ["indie"],
  arcade: ["arcade"],
  "card-and-board-game": ["card-and-board"],
  "point-and-click": ["point-and-click"],
  "hack-and-slash-beat-em-up": ["hack-and-slash"],
  tactical: ["tactical"],
  "visual-novel": ["visual-novel"],
  moba: ["moba"],
  adventure: ["adventure"],
  music: ["music"],
  action: ["action"],
  fantasy: ["fantasy"],
  "science-fiction": ["science-fiction"],
  horror: ["horror"],
  thriller: ["thriller"],
  survival: ["survival"],
  historical: ["history"],
  stealth: ["stealth"],
  comedy: ["comedy"],
  drama: ["drama"],
  sandbox: ["sandbox"],
  kids: ["kids"],
  "open-world": ["open-world"],
  warfare: ["war"],
  party: ["party"],
  mystery: ["mystery"],
  romance: ["romance"],
};

/**
 * Steam's store genres, by their English name lowercased. Steam files a
 * game under a dozen broad genres; "Casual", "Free to Play", "Early Access"
 * and "Massively Multiplayer" describe a business model or a stage rather
 * than a kind of game, and are dropped like any other unmapped genre.
 */
export const STEAM_GENRES: Record<string, string[]> = {
  action: ["action"],
  adventure: ["adventure"],
  rpg: ["rpg"],
  strategy: ["strategy"],
  simulation: ["simulation"],
  sports: ["sports"],
  racing: ["racing"],
  indie: ["indie"],
};

/**
 * Platforms whose variants collapse into one entry on the Add sheet's picker:
 * "PC (Microsoft Windows)" is just PC. Anything not listed keeps IGDB's own
 * slug, name and abbreviation.
 */
export const PLATFORM_ALIASES: Record<
  string,
  { slug: string; name: string; abbreviation: string }
> = {
  win: { slug: "pc", name: "PC", abbreviation: "PC" },
  dos: { slug: "pc", name: "PC", abbreviation: "PC" },
  ps5: { slug: "ps5", name: "PlayStation 5", abbreviation: "PS5" },
  "ps4--1": { slug: "ps4", name: "PlayStation 4", abbreviation: "PS4" },
  ps3: { slug: "ps3", name: "PlayStation 3", abbreviation: "PS3" },
  ps2: { slug: "ps2", name: "PlayStation 2", abbreviation: "PS2" },
  // The game database calls the first PlayStation just "ps"; its address and badge say PS1.
  ps: { slug: "ps1", name: "PlayStation", abbreviation: "PS1" },
  "series-x-s": { slug: "xbox-series", name: "Xbox Series X|S", abbreviation: "XSX" },
  xboxone: { slug: "xbox-one", name: "Xbox One", abbreviation: "XB1" },
  xbox360: { slug: "xbox-360", name: "Xbox 360", abbreviation: "X360" },
  switch: { slug: "switch", name: "Nintendo Switch", abbreviation: "NSW" },
  "switch-2": { slug: "switch-2", name: "Nintendo Switch 2", abbreviation: "NS2" },
  mac: { slug: "mac", name: "Mac", abbreviation: "Mac" },
  linux: { slug: "linux", name: "Linux", abbreviation: "Linux" },
  ios: { slug: "ios", name: "iOS", abbreviation: "iOS" },
  android: { slug: "android", name: "Android", abbreviation: "Android" },
};

/**
 * THE ORDER PLATFORMS ARE SHOWN IN, by slug: PC, then the current consoles,
 * then the ones before them, then the other computers and phones. A
 * platform not named here follows, by name.
 */
export const PLATFORM_ORDER = [
  "pc",
  "ps5",
  "xbox-series",
  "switch-2",
  "switch",
  "ps4",
  "xbox-one",
  "ps3",
  "xbox-360",
  "ps2",
  "ps1",
  "mac",
  "linux",
  "ios",
  "android",
] as const satisfies readonly string[];

/**
 * ONE POPULARITY SCALE ACROSS PROVIDERS, 0 to 100, so a cross-media rail can
 * sort a movie against a game. Each provider's raw signal is log-scaled
 * against a ceiling where its very biggest titles sit; past that everything
 * is 100. The raw signals are stored beside the result, so the formula can
 * change and be recomputed without calling a provider again.
 */
export const popularityScore = (raw: number, ceiling: number): number => {
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  const score = (100 * Math.log10(1 + raw)) / Math.log10(1 + ceiling);
  return Math.round(Math.min(100, score) * 100) / 100;
};

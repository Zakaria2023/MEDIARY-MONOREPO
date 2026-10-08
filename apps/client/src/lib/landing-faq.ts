/** One question on the landing page, with its answer in plain text. */
export type LandingQuestion = {
  question: string;
  answer: string;
};

/**
 * THE LANDING'S QUESTIONS. Rendered as the page's FAQ and sent to search
 * engines as FAQPage structured data from this one list, so the two can
 * never say different things. Every answer is true of the product.
 */
export const LANDING_FAQ: LandingQuestion[] = [
  {
    question: "What can I track on Mediary?",
    answer:
      "Anime, games, movies, TV shows, music, manga and books, all in one library. Each medium keeps its own words and its own progress: episodes, hours, chapters, pages or plays.",
  },
  {
    question: "Is Mediary free?",
    answer: "Yes. Tracking, the diary, stats, lists, reviews, Taste Match, the guide and Name that song are free, with no ads.",
  },
  {
    question: "Can Mediary recommend something for me?",
    answer:
      "Yes. Ask the guide in your own words what you are in the mood for. It searches every medium in Mediary, leaves out what is already in your library, uses what you loved to understand your taste, and says why each pick fits.",
  },
  {
    question: "Can Mediary tell me what song is playing?",
    answer:
      "Yes. Open Name that song and let it listen for a few seconds. It finds the song and opens the record it is on. The microphone is used only while you tap to listen, and the recording is not kept.",
  },
  {
    question: "Can I import my lists from other sites?",
    answer:
      "Yes. Upload a MyAnimeList export, a Letterboxd export or a Mediary CSV. You check every match before anything is added, and titles already in your library are never overwritten.",
  },
  {
    question: "Who can see what I track?",
    answer:
      "You decide. Your profile, your library and your activity can each be public, for followers only, or only for you, and any single title can override its library's setting.",
  },
  {
    question: "Can I take my data with me?",
    answer:
      "Yes. Download your library and your diary as files at any time from your account settings. Deleting your account removes everything you tracked.",
  },
  {
    question: "Where does the catalog come from?",
    answer:
      "From public catalogs of film, television, games, anime, manga, music and books, credited on the credits page. Mediary does not host or stream any of the works it lists.",
  },
];

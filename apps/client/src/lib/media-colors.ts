import { MediaType } from "@/db/enum";

/** One accent per medium, the same on every chart, bar and hub. */
export const MEDIA_COLOR_CLASSES: Record<MediaType, string> = {
  anime: "bg-accent",
  game: "bg-violet",
  movie: "bg-magenta",
  tv: "bg-pink",
  music: "bg-primary",
  manga: "bg-success",
  book: "bg-warning",
  podcast: "bg-status-planned",
  comic: "bg-danger",
};

/** The same accent as text, for a number or a label in the medium's color. */
export const MEDIA_TEXT_CLASSES: Record<MediaType, string> = {
  anime: "text-accent",
  game: "text-violet",
  movie: "text-magenta",
  tv: "text-pink",
  music: "text-primary",
  manga: "text-success",
  book: "text-warning",
  podcast: "text-status-planned",
  comic: "text-danger",
};

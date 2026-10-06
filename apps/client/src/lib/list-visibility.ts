import { Visibility } from "@/db/enum";

/** The choices a list's or a review's visibility control offers. */
export const LIST_VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "public", label: "Everyone" },
  { value: "followers", label: "People who follow you" },
  { value: "private", label: "Only you" },
];

/** The same choices with "your default" first, for a review. */
export const REVIEW_VISIBILITY_OPTIONS = [
  { value: "default", label: "Your activity setting" },
  ...LIST_VISIBILITY_OPTIONS,
];

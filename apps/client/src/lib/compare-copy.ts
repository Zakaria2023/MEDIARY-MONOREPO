import { MIN_SHARED_FOR_MATCH, TasteMatchPage } from "services";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";

/**
 * The sentence under the ring: where the two agree, where they argue, and
 * how much the number is worth. Written from the per-medium values, so it
 * never contradicts the tiles under it.
 */
export const matchSentence = (page: TasteMatchPage): string => {
  const { match, other } = page;
  const sorted = [...match.byType].sort((a, b) => b.value - a.value);
  const best = sorted[0];
  const worst = sorted.length > 1 ? sorted[sorted.length - 1] : undefined;
  const confidence =
    match.confidence >= 20
      ? `High confidence: ${match.confidence} titles in common.`
      : match.confident
        ? `${match.confidence} titles in common so far; the number firms up as you both track more.`
        : `A match needs ${MIN_SHARED_FOR_MATCH} titles you both track; ${
            match.confidence === 0 ? "you have none in common yet" : `${match.confidence} so far`
          }.`;

  if (!match.confident) {
    return `Too early to put a number on you and ${other.displayName}. ${confidence}`;
  }

  if (!best) {
    return `You and ${other.displayName} have no medium in common yet. ${confidence}`;
  }
  const bestLabel = MEDIA_TYPE_PLURAL_LABELS[best.mediaType].toLowerCase();
  if (!worst || worst.value >= best.value - 10) {
    return `You and ${other.displayName} line up across ${bestLabel}${worst ? " and the rest" : ""}. ${confidence}`;
  }
  const worstLabel = MEDIA_TYPE_PLURAL_LABELS[worst.mediaType].toLowerCase();
  return `You agree most on ${bestLabel} and argue about ${worstLabel}. ${confidence}`;
};

import { router } from "expo-router";
import { formatProgress, progressBarValue, progressGoalFor } from "services/pure";
import { MEDIA_TYPE_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { LibraryItem } from "@/lib/api-types";
import { useEntryTick } from "@/hooks/tracking/use-entry-tick";

/**
 * One entry as a row or a card reads it: the status in the medium's words,
 * the progress against its goal, how full the bar is, and the "+1" that
 * is offered while something is not yet finished.
 */
export const useLibraryItem = (item: LibraryItem) => {
  const { title, entry } = item;
  const { isTicking, onTick } = useEntryTick(item);
  const goal = progressGoalFor(title, entry.progressUnit);
  const finished = entry.status === "completed";
  const filled = progressBarValue(entry.progressValue, goal, finished);

  const openSheet = () => router.push({ pathname: "/entry/[mediaUuid]", params: { mediaUuid: title.uuid } });

  return {
    statusLabel: TRACKING_STATUS_LABELS[title.mediaType][entry.status],
    mediumLabel: MEDIA_TYPE_LABELS[title.mediaType],
    progressLabel: formatProgress(entry.progressValue, entry.progressUnit, goal),
    /** How full the bar is, 0 to 1, or null when there is nothing to measure against. */
    fraction: goal ? Math.min(1, filled / goal) : null,
    canTick: !finished,
    isTicking,
    onTick,
    openSheet,
  };
};

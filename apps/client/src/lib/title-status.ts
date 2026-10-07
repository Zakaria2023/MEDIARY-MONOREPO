import { TrackingTarget } from "services";
import { formatCount, formatDate } from "utils";
import { MediaStatus, MediaType } from "@/db/enum";
import { MEDIA_STATUS_LABELS, MEDIA_STATUS_WORDS, PROGRESS_UNIT_LABELS } from "@/db/label";

/** The medium's own word for where a title is in its life: "Airing" for a show, "Ongoing" for a manga. */
export const titleStatusLabel = (mediaType: MediaType, status: MediaStatus): string =>
  MEDIA_STATUS_WORDS[mediaType]?.[status] ?? MEDIA_STATUS_LABELS[status];

/**
 * The one line under a title's name that says what state it is in and how
 * much of it exists: "Airing · 1,180 episodes so far · next 12 Oct",
 * "Finished · 26 episodes", "Coming soon". Null for a title with nothing
 * to say (a released film).
 */
export const titleStatusLine = (
  target: Pick<TrackingTarget, "mediaType" | "titleStatus" | "progressUnit" | "progressTotal" | "progressReleased" | "nextAt">,
): string | null => {
  const parts: string[] = [];
  const unit = PROGRESS_UNIT_LABELS[target.progressUnit];
  const counted = target.progressUnit !== "percent" && target.progressUnit !== "hours";
  if (target.titleStatus !== "unknown" && target.titleStatus !== "released") {
    parts.push(titleStatusLabel(target.mediaType, target.titleStatus));
  }
  if (counted && target.titleStatus === "releasing" && target.progressReleased !== null) {
    parts.push(
      target.progressTotal !== null && target.progressTotal > target.progressReleased
        ? `${formatCount(target.progressReleased)} of ${formatCount(target.progressTotal)} ${unit} out`
        : `${formatCount(target.progressReleased)} ${unit} so far`,
    );
  } else if (counted && target.progressTotal !== null) {
    parts.push(`${formatCount(target.progressTotal)} ${unit}`);
  }
  if (target.nextAt && target.titleStatus === "releasing") {
    parts.push(`next ${formatDate(target.nextAt)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
};

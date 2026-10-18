import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { formatProgress, progressGoalFor } from "services/pure";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { useTracking } from "./use-tracking";

/** What a title's primary action is for this viewer. */
type TrackState = "visitor" | "add" | "held";

/**
 * A title's primary action: sign in, add, or the member's own status and
 * progress ("Watching · 7 / 12"), which opens the sheet to change them.
 */
export const useTrackButton = (mediaUuid: string) => {
  const { isSignedIn } = useAuth();
  const tracking = useTracking(mediaUuid);
  const entry = tracking.data?.entry ?? null;
  const target = tracking.data?.target;

  const state: TrackState = !isSignedIn ? "visitor" : entry ? "held" : "add";
  const label =
    entry && target
      ? `${TRACKING_STATUS_LABELS[target.mediaType][entry.status]} · ${formatProgress(
          entry.progressValue,
          entry.progressUnit,
          progressGoalFor(target, entry.progressUnit),
        )}`
      : "Add to library";

  const onPress = () => {
    if (state === "visitor") {
      router.push("/sign-in");
      return;
    }
    router.push({ pathname: "/entry/[mediaUuid]", params: { mediaUuid } });
  };

  return { state, label, isLoading: Boolean(isSignedIn) && tracking.isPending, onPress };
};

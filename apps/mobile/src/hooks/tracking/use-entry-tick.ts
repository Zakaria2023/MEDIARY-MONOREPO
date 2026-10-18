import { useAuth } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyTick, progressLimitsFor, todayIn } from "services/pure";
import { tickEntry } from "@/lib/api";
import { LibraryItem } from "@/lib/api-types";
import { putEntry, refreshAfterEntryChange } from "@/lib/entry-cache";
import { showToast } from "@/lib/toast-store";

/**
 * THE ONE-TAP "+1" on a library row or a Continue card. The step shows at
 * once, worked out with the server's own rule (reaching the total finishes
 * it, logging on something paused resumes it), and is put back only if the
 * server refuses.
 */
export const useEntryTick = ({ title, entry }: LibraryItem) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const tick = useMutation({
    mutationFn: async (delta: number) => tickEntry(entry.uuid, delta, await getToken()),
    onMutate: (delta) => {
      const next = applyTick(
        entry,
        delta,
        progressLimitsFor(title, entry.progressUnit),
        todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone),
      );
      putEntry(queryClient, title.uuid, { ...entry, ...next, updatedAt: new Date().toISOString() });
      return { previous: entry };
    },
    onError: (error, _delta, context) => {
      if (context) {
        putEntry(queryClient, title.uuid, context.previous);
      }
      showToast(error.message, "error");
    },
    onSuccess: (saved) => {
      putEntry(queryClient, title.uuid, saved);
    },
    onSettled: () => refreshAfterEntryChange(queryClient),
  });

  return {
    isTicking: tick.isPending,
    /** One of the entry's own unit, as the site's "+1": an episode, a chapter, an hour, a play. */
    onTick: () => tick.mutate(1),
  };
};

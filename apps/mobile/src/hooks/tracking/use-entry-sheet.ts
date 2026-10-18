import { useAuth } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { formatProgress, progressGoalFor, progressLimitsFor, settleEntry, todayIn } from "services/pure";
import { UpsertEntryInput, upsertEntrySchema } from "validators";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { removeEntry, saveEntry } from "@/lib/api";
import { TitleTracking, TrackedEntry, TrackingTarget } from "@/lib/api-types";
import { putEntry, refreshAfterEntryChange } from "@/lib/entry-cache";
import { queryKeys } from "@/lib/query-keys";
import { showToast } from "@/lib/toast-store";

/** The device's own zone, which is the member's: the day a save happens in. */
const deviceZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The form's starting values: the entry as stored, or a fresh one in the title's unit. */
const defaultsFor = (target: TrackingTarget, entry: TrackedEntry | null): UpsertEntryInput =>
  entry
    ? {
        mediaUuid: target.uuid,
        status: entry.status,
        score: entry.score,
        progressValue: entry.progressValue,
        progressUnit: entry.progressUnit,
        currentSeason: entry.currentSeason,
        repeatCount: entry.repeatCount,
        favorite: entry.favorite,
        platformId: entry.platformId,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        notes: entry.notes ?? "",
        visibility: entry.visibility,
      }
    : {
        mediaUuid: target.uuid,
        status: "in_progress",
        score: null,
        progressValue: 0,
        progressUnit: target.progressUnit,
        currentSeason: null,
        repeatCount: 0,
        favorite: false,
        platformId: null,
        startedAt: null,
        completedAt: null,
        notes: "",
        visibility: null,
      };

/**
 * THE ADD / UPDATE SHEET, on a phone. Save settles the draft with the same
 * rules the server applies, shows it on every screen at once and closes the
 * sheet; the request goes behind. Only a refusal undoes it, with the
 * server's own sentence. Fields the sheet does not show (dates, season,
 * rewatches, visibility) travel as they were stored.
 */
export const useEntrySheet = (target: TrackingTarget, entry: TrackedEntry | null) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const trackingKey = queryKeys.tracking(target.uuid);

  const form = useForm<UpsertEntryInput>({
    resolver: zodResolver(upsertEntrySchema),
    defaultValues: defaultsFor(target, entry),
  });
  const status = useWatch({ control: form.control, name: "status" });
  const unit = useWatch({ control: form.control, name: "progressUnit" });

  const save = useMutation({
    mutationFn: async (input: UpsertEntryInput) => saveEntry(input, await getToken()),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: trackingKey });
      const previous = queryClient.getQueryData<TitleTracking>(trackingKey);
      const settled = settleEntry(input, progressLimitsFor(target, input.progressUnit), todayIn(deviceZone()));
      putEntry(queryClient, target.uuid, {
        uuid: entry?.uuid ?? "",
        ...input,
        ...settled,
        notes: input.notes || null,
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(trackingKey, context?.previous);
      showToast(error.message, "error");
    },
    onSuccess: (saved) => {
      putEntry(queryClient, target.uuid, saved);
    },
    onSettled: () => refreshAfterEntryChange(queryClient),
  });

  const remove = useMutation({
    mutationFn: async (entryUuid: string) => removeEntry(entryUuid, await getToken()),
    onSuccess: () => {
      putEntry(queryClient, target.uuid, null);
      refreshAfterEntryChange(queryClient);
      router.back();
    },
  });

  const onSubmit = () => {
    void form.handleSubmit((values) => {
      save.mutate(values);
      router.back();
    })();
  };

  const onRemove = () => {
    if (entry) {
      remove.mutate(entry.uuid);
    }
  };

  /**
   * Choosing the medium's "done" word means all of it: progress goes to the
   * title's total the moment it is pressed, as Save would settle it.
   */
  const onStatusChange = (next: UpsertEntryInput["status"]) => {
    form.setValue("status", next, { shouldDirty: true });
    const total = progressLimitsFor(target, form.getValues("progressUnit")).total;
    if (next === "completed" && total !== null) {
      form.setValue("progressValue", total, { shouldDirty: true });
    }
  };

  const limits = progressLimitsFor(target, unit);
  const goal = progressGoalFor(target, unit);

  return {
    form,
    status,
    unit,
    /** Under the title: "2021 · Movie", and where the stored entry is: "· 7 / 12". */
    subtitle: [
      target.releaseYear ? String(target.releaseYear) : null,
      MEDIA_TYPE_LABELS[target.mediaType],
      entry ? formatProgress(entry.progressValue, entry.progressUnit, progressGoalFor(target, entry.progressUnit)) : null,
    ]
      .filter(Boolean)
      .join(" · "),
    /** What the progress reads against: "of 12", or a game's hours to finish. */
    goal,
    /** The most progress may be right now: what is out, else the total. */
    cap: limits.released ?? limits.total,
    /** Completed with a known total: the progress is the status's to say. */
    progressLocked: status === "completed" && limits.total !== null,
    error: remove.error?.message ?? form.formState.errors.root?.message ?? null,
    isRemoving: remove.isPending,
    onSubmit,
    onRemove,
    onStatusChange,
  };
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { TrackedEntry, TrackingTarget } from "services";
import { progressLimitsFor, settleEntry, todayIn } from "services/pure";
import { UpsertEntryInput, upsertEntrySchema } from "validators";
import {
  EntryActionResult,
  removeEntryAction,
  saveEntryAction,
} from "@/app/(app)/library/actions";

type EntrySheetOptions = {
  target: TrackingTarget;
  entry: TrackedEntry | null;
  /** The draft, settled, the moment Save is pressed. */
  onOptimistic: (entry: TrackedEntry) => void;
  /** The entry as the server stored it. */
  onSaved: (entry: TrackedEntry) => void;
  onFailed: () => void;
  onRemoved: () => void;
};

/** The form's starting values: the entry as stored, or a fresh one. */
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
 * THE ADD / UPDATE SHEET'S BEHAVIOR: the draft, its save and its remove.
 * The save settles the draft with the same rules the server applies and
 * hands it to the screen before the request leaves, so Save feels like a
 * tap and not a wait.
 */
export const useEntrySheet = ({
  target,
  entry,
  onOptimistic,
  onSaved,
  onFailed,
  onRemoved,
}: EntrySheetOptions) => {
  const [state, dispatch, isPending] = useActionState(
    async (previous: EntryActionResult, input: UpsertEntryInput) => {
      const result = await saveEntryAction(previous, input);
      if (result.entry) {
        onSaved(result.entry);
      } else {
        onFailed();
      }
      return result;
    },
    {},
  );
  const [isRemoving, startRemove] = useTransition();

  const form = useForm<UpsertEntryInput>({
    resolver: zodResolver(upsertEntrySchema),
    defaultValues: defaultsFor(target, entry),
  });

  const onSubmit = form.handleSubmit((values) => {
    const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
    onOptimistic({
      uuid: entry?.uuid ?? "",
      ...values,
      ...settleEntry(values, progressLimitsFor(target, values.progressUnit), today),
      notes: values.notes || null,
      updatedAt: new Date(),
    });
    startTransition(() => {
      dispatch(values);
    });
  });

  const onRemove = () => {
    if (!entry) {
      return;
    }
    startRemove(async () => {
      const result = await removeEntryAction({ entryUuid: entry.uuid });
      if (result.success) {
        onRemoved();
      } else {
        form.setError("root", { message: result.error ?? "Could not remove this entry" });
      }
    });
  };

  return {
    form,
    error: state.error ?? form.formState.errors.root?.message,
    isPending,
    isRemoving,
    onSubmit,
    onRemove,
  };
};

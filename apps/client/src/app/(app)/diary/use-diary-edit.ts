"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { DiaryLine } from "services";
import { DiaryEditInput, diaryEditSchema } from "validators";
import { deleteDiaryLineAction, updateDiaryLineAction } from "./actions";

/** The day a moment falls on, YYYY-MM-DD, in a zone. */
const dayOf = (moment: Date, timezone: string): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(moment);

/**
 * The small dialog that corrects a diary moment: the day and the note,
 * saved as a form, or the moment removed. The card closes itself once a
 * save or a removal has gone through.
 */
export const useDiaryEdit = (line: DiaryLine, timezone: string) => {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isRemoving, startRemove] = useTransition();
  const [state, dispatch, isPending] = useActionState(updateDiaryLineAction, {});

  const form = useForm<DiaryEditInput>({
    resolver: zodResolver(diaryEditSchema),
    defaultValues: { eventUuid: line.uuid, day: dayOf(line.eventAt, timezone), note: line.note ?? "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const onRemove = () => {
    setRemoveError(null);
    startRemove(async () => {
      const result = await deleteDiaryLineAction({ eventUuid: line.uuid });
      if (result.success) {
        setRemoved(true);
        setOpen(false);
      } else {
        setRemoveError(result.error ?? "Could not remove this moment");
      }
    });
  };

  return {
    open,
    setOpen,
    removed,
    form,
    state,
    isPending,
    isRemoving,
    removeError,
    onSubmit,
    onRemove,
  };
};

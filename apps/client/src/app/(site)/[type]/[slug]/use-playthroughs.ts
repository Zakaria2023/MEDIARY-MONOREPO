"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Playthrough } from "services";
import { PlaythroughInput, playthroughSchema } from "validators";
import { deletePlaythroughAction, PlaythroughActionResult, savePlaythroughAction } from "./actions";

type PlaythroughsOptions = {
  mediaUuid: string;
  initial: Playthrough[];
};

/** Which run the form is for: a new one, an existing one by uuid, or closed. */
export type PlaythroughEditing = "new" | string | null;

const blank = (mediaUuid: string): PlaythroughInput => ({
  mediaUuid,
  playthroughUuid: null,
  platformId: null,
  difficulty: "",
  startedAt: null,
  completedAt: null,
  hours: null,
  score: null,
  notes: "",
});

const fromRun = (mediaUuid: string, run: Playthrough): PlaythroughInput => ({
  mediaUuid,
  playthroughUuid: run.uuid,
  platformId: run.platformId,
  difficulty: run.difficulty ?? "",
  startedAt: run.startedAt,
  completedAt: run.completedAt,
  hours: run.hours,
  score: run.score,
  notes: run.notes ?? "",
});

/**
 * The playthroughs panel on a game's page: the runs listed, one form for
 * adding or correcting a run, removal at once with the row put back if
 * the server refuses.
 */
export const usePlaythroughs = ({ mediaUuid, initial }: PlaythroughsOptions) => {
  const [runs, setRuns] = useState(initial);
  const [editing, setEditing] = useState<PlaythroughEditing>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, startRemove] = useTransition();
  const form = useForm<PlaythroughInput>({
    resolver: zodResolver(playthroughSchema),
    defaultValues: blank(mediaUuid),
  });
  const [state, dispatch, isPending] = useActionState(
    async (previous: PlaythroughActionResult, input: PlaythroughInput) => {
      const result = await savePlaythroughAction(previous, input);
      if (result.playthrough) {
        const saved = result.playthrough;
        setRuns((current) =>
          current.some((run) => run.uuid === saved.uuid)
            ? current.map((run) => (run.uuid === saved.uuid ? saved : run))
            : [...current, saved],
        );
        setEditing(null);
        form.reset(blank(mediaUuid));
      }
      return result;
    },
    {},
  );

  const onAdd = () => {
    setError(null);
    form.reset(blank(mediaUuid));
    setEditing("new");
  };

  const onEdit = (run: Playthrough) => {
    setError(null);
    form.reset(fromRun(mediaUuid, run));
    setEditing(run.uuid);
  };

  const onCancel = () => {
    setEditing(null);
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const onRemove = (uuid: string) => {
    const before = runs;
    setError(null);
    setRuns((current) => current.filter((run) => run.uuid !== uuid));
    if (editing === uuid) {
      setEditing(null);
    }
    startRemove(async () => {
      const result = await deletePlaythroughAction({ playthroughUuid: uuid });
      if (!result.success) {
        setRuns(before);
        setError(result.error ?? "Could not remove the playthrough");
      }
    });
  };

  return {
    runs,
    editing,
    form,
    onAdd,
    onEdit,
    onCancel,
    onSubmit,
    onRemove,
    isPending,
    isRemoving,
    error: error ?? (editing ? state.error : undefined),
  };
};

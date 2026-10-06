"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ListChoice } from "services";
import { ListInput, listSchema } from "validators";
import {
  addToListAction,
  createListForTitleAction,
  ListChoiceActionResult,
  removeFromListAction,
} from "./actions";

type AddToListOptions = {
  mediaUuid: string;
  initial: ListChoice[];
};

/**
 * The add-to-list dialog: each list is a tick that flips at once and flips
 * back if the server refuses; "New list" makes one with the title already
 * on it and adds it to the ticks.
 */
export const useAddToList = ({ mediaUuid, initial }: AddToListOptions) => {
  const [choices, setChoices] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, startToggle] = useTransition();
  const newList = useForm<ListInput>({
    resolver: zodResolver(listSchema),
    defaultValues: { name: "", description: "", visibility: "public" },
  });
  const [state, dispatch, isCreating] = useActionState(
    async (previous: ListChoiceActionResult, input: ListInput) => {
      const result = await createListForTitleAction(previous, { ...input, mediaUuid });
      if (result.choice) {
        const created = result.choice;
        setChoices((current) => [created, ...current]);
        newList.reset({ name: "", description: "", visibility: "public" });
      }
      return result;
    },
    {},
  );

  const onToggle = (listUuid: string) => {
    const choice = choices.find((item) => item.uuid === listUuid);
    if (!choice) {
      return;
    }
    const contains = !choice.contains;
    setError(null);
    setChoices((current) =>
      current.map((item) => (item.uuid === listUuid ? { ...item, contains } : item)),
    );
    startToggle(async () => {
      const result = contains
        ? await addToListAction({ listUuid, mediaUuid })
        : await removeFromListAction({ listUuid, mediaUuid });
      if (!result.success) {
        setChoices((current) =>
          current.map((item) => (item.uuid === listUuid ? { ...item, contains: !contains } : item)),
        );
        setError(result.error ?? "Could not update the list");
      }
    });
  };

  const onCreate = newList.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return {
    choices,
    open,
    setOpen,
    onToggle,
    isToggling,
    newList,
    onCreate,
    isCreating,
    error: error ?? state.error ?? undefined,
    onCount: choices.filter((choice) => choice.contains).length,
  };
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ListDetail } from "services";
import { ActionResult } from "utils";
import { ListInput, listSchema } from "validators";
import { deleteListAction, EditListInput, removeListItemAction, updateListAction } from "./actions";

/**
 * The owner's tools on a list page: the edit dialog, deletion, and taking a
 * title off. A removed title disappears at once and comes back if the
 * server refuses.
 */
export const useListEditor = (list: ListDetail) => {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [removedUuids, setRemovedUuids] = useState<string[]>([]);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [state, dispatch, isSaving] = useActionState(
    async (previous: ActionResult, input: EditListInput) => {
      const result = await updateListAction(previous, input);
      if (result.success) {
        setEditing(false);
      }
      return result;
    },
    {},
  );

  const form = useForm<ListInput>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: list.name,
      description: list.description ?? "",
      visibility: list.visibility,
    },
  });

  const onSave = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, listUuid: list.uuid });
    });
  });

  const onDelete = () => {
    startDelete(async () => {
      const result = await deleteListAction({ listUuid: list.uuid });
      if (result.error) {
        setDeleteError(result.error);
      }
    });
  };

  const onRemoveItem = (mediaUuid: string) => {
    setRemoveError(null);
    setRemovedUuids((current) => [...current, mediaUuid]);
    startRemove(async () => {
      const result = await removeListItemAction({ listUuid: list.uuid, mediaUuid });
      if (!result.success) {
        setRemovedUuids((current) => current.filter((uuid) => uuid !== mediaUuid));
        setRemoveError(result.error ?? "Could not take this title off the list");
      }
    });
  };

  return {
    editing,
    setEditing,
    confirmingDelete,
    setConfirmingDelete,
    form,
    saveError: state.error,
    isSaving,
    onSave,
    isDeleting,
    deleteError,
    onDelete,
    items: list.items.filter((item) => !removedUuids.includes(item.uuid)),
    isRemoving,
    removeError,
    onRemoveItem,
  };
};

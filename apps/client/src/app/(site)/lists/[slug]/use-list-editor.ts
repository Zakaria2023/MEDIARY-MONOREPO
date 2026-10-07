"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ListDetail } from "services";
import { ActionResult } from "utils";
import { ListInput, listSchema } from "validators";
import { deleteListAction, EditListInput, moveListItemAction, removeListItemAction, updateListAction } from "./actions";

/**
 * The owner's tools on a list page: the edit dialog, deletion, and taking a
 * title off. A removed title disappears at once and comes back if the
 * server refuses.
 */
export const useListEditor = (list: ListDetail) => {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [removedUuids, setRemovedUuids] = useState<string[]>([]);
  const [order, setOrder] = useState(list.items);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isMoving, startMove] = useTransition();
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
      ranked: list.ranked,
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

  /** One place up or down, shown at once and undone on a refusal. */
  const onMoveItem = (mediaUuid: string, direction: "up" | "down") => {
    const before = order;
    const index = before.findIndex((item) => item.uuid === mediaUuid);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= before.length) {
      return;
    }
    const next = [...before];
    const [moved] = next.splice(index, 1);
    if (!moved) {
      return;
    }
    next.splice(target, 0, moved);
    setOrder(next);
    setMoveError(null);
    startMove(async () => {
      const result = await moveListItemAction({ listUuid: list.uuid, mediaUuid, direction });
      if (!result.success) {
        setOrder(before);
        setMoveError(result.error ?? "Could not move this title");
      }
    });
  };

  return {
    editing,
    setEditing,
    onMoveItem,
    isMoving,
    moveError,
    confirmingDelete,
    setConfirmingDelete,
    form,
    saveError: state.error,
    isSaving,
    onSave,
    isDeleting,
    deleteError,
    onDelete,
    items: order.filter((item) => !removedUuids.includes(item.uuid)),
    isRemoving,
    removeError,
    onRemoveItem,
  };
};

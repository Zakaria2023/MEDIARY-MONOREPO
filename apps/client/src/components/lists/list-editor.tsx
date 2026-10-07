"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { ListDetail } from "services";
import { Button, Checkbox, ConfirmDialog, Dialog, Dropdown, FormError, Input, Textarea } from "ui";
import { useListEditor } from "@/app/(site)/lists/[slug]/use-list-editor";
import { ListHeader } from "@/components/lists/list-header";
import { ListItems } from "@/components/lists/list-items";
import { LIST_VISIBILITY_OPTIONS } from "@/lib/list-visibility";

type ListEditorProps = {
  list: ListDetail;
};

/**
 * The owner's view of their list: the header with Edit and Delete, the
 * titles with a remove on each, the edit dialog and the delete confirm.
 */
export const ListEditor = ({ list }: ListEditorProps) => {
  const {
    editing,
    setEditing,
    confirmingDelete,
    setConfirmingDelete,
    form: { register, control, formState },
    saveError,
    isSaving,
    onSave,
    isDeleting,
    deleteError,
    onDelete,
    items,
    isRemoving,
    removeError,
    onRemoveItem,
    onMoveItem,
    isMoving,
    moveError,
  } = useListEditor(list);

  return (
    <>
      <ListHeader
        list={list}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil size={16} />
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        }
      />
      <FormError message={removeError ?? moveError ?? undefined} />
      <ListItems items={items} ranked={list.ranked} onRemove={onRemoveItem} isRemoving={isRemoving} onMove={onMoveItem} isMoving={isMoving} />

      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit list"
        description="The address stays the same whatever you call it."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="edit-list-form" disabled={isSaving}>
              {isSaving ? "Saving" : "Save"}
            </Button>
          </div>
        }
      >
        <form id="edit-list-form" onSubmit={onSave} className="flex flex-col gap-4">
          <Input label="Name" error={formState.errors.name?.message} {...register("name")} />
          <Textarea
            label="Description"
            rows={3}
            error={formState.errors.description?.message}
            {...register("description")}
          />
          <Checkbox label="Ranked list: number the titles and order them" {...register("ranked")} />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Who can see it</span>
            <Controller
              control={control}
              name="visibility"
              render={({ field }) => (
                <Dropdown value={field.value} onChange={field.onChange} options={LIST_VISIBILITY_OPTIONS} />
              )}
            />
          </div>
          <FormError message={saveError} />
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this list?"
        description={`${list.name} and its ${list.itemCount} titles will be gone. The titles stay in your library.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
        onConfirm={onDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
};

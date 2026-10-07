"use client";

import { Pencil, Trash2 } from "lucide-react";
import { DiaryLine } from "services";
import { Button, Dialog, FormError, Input, Textarea } from "ui";
import { useDiaryEdit } from "@/app/(app)/diary/use-diary-edit";

type DiaryLineEditorProps = {
  line: DiaryLine;
  timezone: string;
};

/**
 * The pencil on a diary card, for the owner: a small dialog to correct the
 * day and the note, or to remove the moment. What changed stays as
 * history; a wrong moment goes altogether.
 */
export const DiaryLineEditor = ({ line, timezone }: DiaryLineEditorProps) => {
  const {
    open,
    setOpen,
    form: { register, formState },
    state,
    isPending,
    isRemoving,
    removeError,
    onSubmit,
    onRemove,
  } = useDiaryEdit(line, timezone);
  const formId = `diary-edit-${line.uuid}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Correct this moment of ${line.title.canonicalTitle}`}
        className="absolute end-2 top-2 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-chip border border-hairline bg-overlay/90 text-muted opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:text-ink"
      >
        <Pencil size={13} />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Correct this moment"
        description={`${line.title.canonicalTitle}. The day and the note can change; what happened stays.`}
        size="sm"
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={onRemove} disabled={isRemoving || isPending} className="text-danger">
              <Trash2 size={15} />
              {isRemoving ? "Removing" : "Remove"}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" form={formId} disabled={isPending}>
                {isPending ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input label="Day" type="date" error={formState.errors.day?.message} {...register("day")} />
          <Textarea label="Note" rows={3} placeholder="Optional" error={formState.errors.note?.message} {...register("note")} />
          <FormError message={state.error ?? removeError ?? undefined} />
          {state.success && !isPending && <p className="text-sm text-success">Saved</p>}
        </form>
      </Dialog>
    </>
  );
};

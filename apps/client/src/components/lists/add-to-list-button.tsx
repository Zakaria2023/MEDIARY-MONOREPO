"use client";

import { ListPlus, Lock, Users } from "lucide-react";
import { Controller } from "react-hook-form";
import { ListChoice } from "services";
import { Button, Checkbox, Dialog, Dropdown, FormError, Input } from "ui";
import { useAddToList } from "@/app/(site)/[type]/[slug]/use-add-to-list";
import { LIST_VISIBILITY_OPTIONS } from "@/lib/list-visibility";

type AddToListButtonProps = {
  mediaUuid: string;
  initial: ListChoice[];
};

/**
 * "Add to list" on a title page: a dialog of the member's lists as ticks,
 * and a line to make a new one with the title already on it.
 */
export const AddToListButton = ({ mediaUuid, initial }: AddToListButtonProps) => {
  const {
    choices,
    open,
    setOpen,
    onToggle,
    isToggling,
    newList: { register, control, formState },
    onCreate,
    isCreating,
    error,
    onCount,
  } = useAddToList({ mediaUuid, initial });

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <ListPlus size={18} />
        {onCount === 0 ? "Add to list" : onCount === 1 ? "On 1 list" : `On ${onCount} lists`}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add to a list"
        description="Tick every list this belongs on."
        size="sm"
      >
        <div className="flex flex-col gap-5">
          {choices.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {choices.map((choice) => (
                <li key={choice.uuid} className="flex items-center justify-between gap-3">
                  <Checkbox
                    id={`list-${choice.uuid}`}
                    label={choice.name}
                    checked={choice.contains}
                    disabled={isToggling}
                    onChange={() => onToggle(choice.uuid)}
                  />
                  {choice.visibility === "private" && <Lock size={13} className="text-faint" />}
                  {choice.visibility === "followers" && <Users size={13} className="text-faint" />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">You have no lists yet. Make the first one here.</p>
          )}

          <form onSubmit={onCreate} className="flex flex-col gap-3 border-t border-hairline pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-faint">New list</span>
            <Input
              placeholder="Name the list"
              error={formState.errors.name?.message}
              {...register("name")}
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Controller
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <Dropdown value={field.value} onChange={field.onChange} options={LIST_VISIBILITY_OPTIONS} />
                  )}
                />
              </div>
              <Button type="submit" variant="outline" disabled={isCreating}>
                {isCreating ? "Creating" : "Create"}
              </Button>
            </div>
          </form>
          <FormError message={error} />
        </div>
      </Dialog>
    </>
  );
};

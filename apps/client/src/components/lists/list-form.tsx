"use client";

import { Controller } from "react-hook-form";
import { Button, Dropdown, FormError, Input, Textarea } from "ui";
import { useListForm } from "@/app/(app)/lists/use-list-form";
import { LIST_VISIBILITY_OPTIONS } from "@/lib/list-visibility";

/** The new-list form at the top of the lists page. A success opens the list. */
export const ListForm = () => {
  const {
    form: { register, control, formState },
    state,
    isPending,
    onSubmit,
  } = useListForm();

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5"
    >
      <h2 className="font-display text-lg text-ink">New list</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <Input
          label="Name"
          placeholder="Comfort rewatches"
          error={formState.errors.name?.message}
          {...register("name")}
        />
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
      </div>
      <Textarea
        label="Description"
        placeholder="What ties these together."
        rows={2}
        error={formState.errors.description?.message}
        {...register("description")}
      />
      <FormError message={state.error} />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating" : "Create list"}
        </Button>
      </div>
    </form>
  );
};

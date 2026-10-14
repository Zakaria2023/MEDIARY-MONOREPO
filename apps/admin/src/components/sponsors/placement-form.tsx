"use client";

import { Controller } from "react-hook-form";
import { Button, Dropdown, FormError, Input, Textarea } from "ui";
import { sponsorSurfaces } from "@/db/enum";
import { SPONSOR_SURFACE_LABELS } from "@/db/label";
import { FieldLabel } from "@/components/shared/field-label";
import { usePlacementForm } from "@/app/(dashboard)/sponsors/[uuid]/use-placement-form";

type PlacementFormProps = {
  campaignUuid: string;
};

const SURFACE_OPTIONS = sponsorSurfaces.map((value) => ({ value, label: SPONSOR_SURFACE_LABELS[value] }));

/**
 * A sponsored title in one slot. The artwork is always the title's own; the
 * words are Mediary's, set here, and the card says "Sponsored" and whose
 * whatever is written. The button opens the title's page unless a store's
 * address is given.
 */
export const PlacementForm = ({ campaignUuid }: PlacementFormProps) => {
  const {
    form: { register, control, formState },
    state,
    isPending,
    onSubmit,
  } = usePlacementForm(campaignUuid);
  const errors = formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <h3 className="font-display text-base text-ink">New placement</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Title" placeholder="/game/elden-ring" error={errors.title?.message} {...register("title")} />
        <FieldLabel label="Screen">
          <Controller
            control={control}
            name="surface"
            render={({ field }) => <Dropdown value={field.value} onChange={field.onChange} options={SURFACE_OPTIONS} />}
          />
        </FieldLabel>
        <Input label="Headline" placeholder="Out now" error={errors.headline?.message} {...register("headline")} />
        <Input label="Button" error={errors.ctaLabel?.message} {...register("ctaLabel")} />
        <Input
          label="Store address"
          placeholder="Optional; the title's page if empty"
          type="url"
          error={errors.destinationUrl?.message}
          {...register("destinationUrl")}
        />
        <Input label="Weight" type="number" min={1} max={100} error={errors.weight?.message} {...register("weight", { valueAsNumber: true })} />
      </div>
      <Textarea label="A line under the headline" placeholder="Optional" rows={2} error={errors.body?.message} {...register("body")} />
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {state.success && !isPending && <span className="text-sm text-success">Added</span>}
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Adding" : "Add placement"}
        </Button>
      </div>
    </form>
  );
};

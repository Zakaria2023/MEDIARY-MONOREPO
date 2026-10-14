"use client";

import { Controller } from "react-hook-form";
import { Button, Dropdown, FormError, Input } from "ui";
import { storeLinkKinds, stores } from "@/db/enum";
import { STORE_LABELS, STORE_LINK_KIND_LABELS } from "@/db/label";
import { FieldLabel } from "@/components/shared/field-label";
import { useStoreLinkForm } from "@/app/(dashboard)/catalog/[uuid]/use-store-link-form";

type StoreLinkFormProps = {
  mediaUuid: string;
};

const STORE_OPTIONS = stores.map((value) => ({ value, label: STORE_LABELS[value] }));

const KIND_OPTIONS = storeLinkKinds.map((value) => ({ value, label: STORE_LINK_KIND_LABELS[value] }));

/** A store, what the button says, and the address on that store's own site. Saving a store already listed replaces it. */
export const StoreLinkForm = ({ mediaUuid }: StoreLinkFormProps) => {
  const {
    form: { register, control, formState },
    state,
    isPending,
    onSubmit,
  } = useStoreLinkForm(mediaUuid);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Store">
          <Controller
            control={control}
            name="store"
            render={({ field }) => <Dropdown value={field.value} onChange={field.onChange} options={STORE_OPTIONS} searchable />}
          />
        </FieldLabel>
        <FieldLabel label="Button">
          <Controller
            control={control}
            name="kind"
            render={({ field }) => <Dropdown value={field.value} onChange={field.onChange} options={KIND_OPTIONS} />}
          />
        </FieldLabel>
      </div>
      <Input label="Address on the store" placeholder="https://" type="url" error={formState.errors.url?.message} {...register("url")} />
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {state.success && !isPending && <span className="text-sm text-success">Saved</span>}
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Saving" : "Save link"}
        </Button>
      </div>
    </form>
  );
};

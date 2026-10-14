"use client";

import { Button, FormError, Input } from "ui";
import { useAdvertiserForm } from "@/app/(dashboard)/sponsors/use-advertiser-form";

/** A company that books placements: the name people read beside its placements, and staff's own details. */
export const AdvertiserForm = () => {
  const {
    form: { register, formState },
    state,
    isPending,
    onSubmit,
  } = useAdvertiserForm();
  const errors = formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <h3 className="font-display text-base text-ink">New advertiser</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name on placements" placeholder="Bandai Namco" error={errors.displayName?.message} {...register("displayName")} />
        <Input label="Legal name" placeholder="Bandai Namco Entertainment Inc." error={errors.legalName?.message} {...register("legalName")} />
        <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
        <Input label="Billing reference" placeholder="Optional" error={errors.billingReference?.message} {...register("billingReference")} />
      </div>
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {state.success && !isPending && <span className="text-sm text-success">Added</span>}
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Adding" : "Add advertiser"}
        </Button>
      </div>
    </form>
  );
};

"use client";

import { Button, FormError, Input } from "ui";
import { useInvoiceForm } from "@/app/(dashboard)/sponsors/[uuid]/use-invoice-form";

type InvoiceFormProps = {
  campaignUuid: string;
  currency: string;
};

/** A new invoice, in the campaign's currency, as a draft until it is issued. */
export const InvoiceForm = ({ campaignUuid, currency }: InvoiceFormProps) => {
  const {
    form: { register, formState },
    state,
    isPending,
    onSubmit,
  } = useInvoiceForm(campaignUuid);
  const errors = formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <h3 className="font-display text-base text-ink">New invoice</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Number" placeholder="MED-2026-001" error={errors.number?.message} {...register("number")} />
        <Input label={`Amount (${currency})`} placeholder="1250.00" inputMode="decimal" error={errors.amount?.message} {...register("amount")} />
        <Input label="Due" type="date" error={errors.dueOn?.message} {...register("dueOn")} />
      </div>
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {state.success && !isPending && <span className="text-sm text-success">Added</span>}
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Adding" : "Add invoice"}
        </Button>
      </div>
    </form>
  );
};

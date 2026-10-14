"use client";

import { Controller } from "react-hook-form";
import { AdvertiserRow } from "services";
import { Button, Dropdown, FormError, Input, Textarea } from "ui";
import { FieldLabel } from "@/components/shared/field-label";
import { useCampaignForm } from "@/app/(dashboard)/sponsors/use-campaign-form";

type CampaignFormProps = {
  advertisers: Pick<AdvertiserRow, "uuid" | "displayName">[];
};

/**
 * A new campaign: whose, its dates as whole days, its budget and how often
 * one member may see it a day. It starts as a draft; placements come next.
 */
export const CampaignForm = ({ advertisers }: CampaignFormProps) => {
  const {
    form: { register, control, formState },
    state,
    isPending,
    onSubmit,
  } = useCampaignForm(advertisers[0]?.uuid ?? "");
  const errors = formState.errors;
  const options = advertisers.map((advertiser) => ({ value: advertiser.uuid, label: advertiser.displayName }));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <h3 className="font-display text-base text-ink">New campaign</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Advertiser">
          <Controller
            control={control}
            name="advertiserUuid"
            render={({ field }) => <Dropdown value={field.value} onChange={field.onChange} options={options} placeholder="Pick an advertiser" />}
          />
          <FormError message={errors.advertiserUuid?.message} />
        </FieldLabel>
        <Input label="Campaign name" placeholder="Launch week" error={errors.name?.message} {...register("name")} />
        <Input label="First day" type="date" error={errors.startsOn?.message} {...register("startsOn")} />
        <Input label="Last day" type="date" error={errors.endsOn?.message} {...register("endsOn")} />
        <Input label="Budget" placeholder="Optional, like 1250" inputMode="decimal" error={errors.budget?.message} {...register("budget")} />
        <Input label="Currency" maxLength={3} error={errors.currency?.message} {...register("currency")} />
        <Input
          label="Times a member may see it a day"
          type="number"
          min={1}
          max={20}
          error={errors.frequencyCap?.message}
          {...register("frequencyCap", { valueAsNumber: true })}
        />
      </div>
      <Textarea label="Objective" placeholder="Optional: what the advertiser wants from it" rows={2} error={errors.objective?.message} {...register("objective")} />
      <FormError message={state.error} />
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isPending || advertisers.length === 0}>
          {isPending ? "Creating" : "Create draft"}
        </Button>
      </div>
    </form>
  );
};

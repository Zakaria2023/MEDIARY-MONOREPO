"use client";

import { Controller } from "react-hook-form";
import { Button, Checkbox, Dropdown, FormError } from "ui";
import { CreatorSettingsInput } from "validators";
import { creatorCategories } from "@/db/enum";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";
import { SettingsField } from "@/components/settings/settings-field";
import { useCreatorSettings } from "@/app/(app)/studio/use-creator-settings";

type CreatorSettingsFormProps = {
  initial: CreatorSettingsInput;
};

const CATEGORY_OPTIONS = creatorCategories.map((value) => ({ value, label: CREATOR_CATEGORY_LABELS[value] }));

/** What a verified creator sets for themselves: the word on their badge, and whether the directory lists them. */
export const CreatorSettingsForm = ({ initial }: CreatorSettingsFormProps) => {
  const {
    form: { register, control },
    state,
    isPending,
    onSubmit,
  } = useCreatorSettings(initial);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg text-ink">Your badge</h2>
      <SettingsField label="What you make" description="The word beside the mark on your profile.">
        <Controller
          control={control}
          name="category"
          render={({ field }) => <Dropdown value={field.value} onChange={field.onChange} options={CATEGORY_OPTIONS} />}
        />
      </SettingsField>
      <Checkbox label="List me on the creators page (only while my profile is public)" {...register("discoverable")} />
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3 border-t border-hairline pt-5">
        {state.success && !isPending && <span className="text-sm text-success">Saved</span>}
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Saving" : "Save"}
        </Button>
      </div>
    </form>
  );
};

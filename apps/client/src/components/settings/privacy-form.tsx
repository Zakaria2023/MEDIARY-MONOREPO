"use client";

import { Controller } from "react-hook-form";
import { PrivacySettings } from "services";
import { Button, Checkbox, Dropdown, FormError } from "ui";
import { SettingsField } from "@/components/settings/settings-field";
import { usePrivacyForm } from "@/app/(app)/settings/privacy/use-privacy-form";

type PrivacyFormProps = {
  settings: PrivacySettings;
};

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Everyone" },
  { value: "followers", label: "People who follow you" },
  { value: "private", label: "Only you" },
];

const COMPARISON_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "followers", label: "People who follow you" },
  { value: "nobody", label: "Nobody" },
];

export const PrivacyForm = ({ settings }: PrivacyFormProps) => {
  const {
    form: { control, register },
    state,
    isPending,
    onSubmit,
  } = usePrivacyForm(settings);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-card border border-hairline bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Privacy</h2>
        <p className="text-sm text-muted">
          Everything starts open. A private library is a complete Mediary; it
          is only a choice.
        </p>
      </div>

      <SettingsField
        label="Profile"
        description="Who can open your profile page."
      >
        <Controller
          control={control}
          name="profileVisibility"
          render={({ field }) => (
            <Dropdown value={field.value} onChange={field.onChange} options={VISIBILITY_OPTIONS} />
          )}
        />
      </SettingsField>

      <SettingsField
        label="Library"
        description="Who can see what you track. Each entry can override this."
      >
        <Controller
          control={control}
          name="libraryVisibility"
          render={({ field }) => (
            <Dropdown value={field.value} onChange={field.onChange} options={VISIBILITY_OPTIONS} />
          )}
        />
      </SettingsField>

      <SettingsField
        label="Activity"
        description="Who sees your diary in their feed."
      >
        <Controller
          control={control}
          name="activityVisibility"
          render={({ field }) => (
            <Dropdown value={field.value} onChange={field.onChange} options={VISIBILITY_OPTIONS} />
          )}
        />
      </SettingsField>

      <SettingsField
        label="Taste Match"
        description="Who can compare their taste with yours."
      >
        <Controller
          control={control}
          name="tasteComparison"
          render={({ field }) => (
            <Dropdown value={field.value} onChange={field.onChange} options={COMPARISON_OPTIONS} />
          )}
        />
      </SettingsField>

      <div className="flex flex-col gap-3 border-t border-hairline pt-5">
        <Checkbox label="Hide spoilers until I click them" {...register("hideSpoilers")} />
        <Checkbox label="Show adult titles in explore and search" {...register("showAdultContent")} />
      </div>

      <FormError message={state.error} />

      <div className="flex items-center justify-end gap-3 border-t border-hairline pt-5">
        {state.success && !isPending && (
          <span className="text-sm text-success">Saved</span>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
};


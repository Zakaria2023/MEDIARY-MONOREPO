"use client";

import { FormEventHandler } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { TrackingPlatform } from "services";
import { Button, Dropdown, FormError, Input, Textarea } from "ui";
import { PlaythroughInput } from "validators";

type PlaythroughFormProps = {
  form: UseFormReturn<PlaythroughInput>;
  platforms: TrackingPlatform[];
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isPending: boolean;
  error?: string;
  heading: string;
};

/** The value the platform picker uses for "none"; a platform id is never this. */
const NO_PLATFORM = "none";

/** An input's text as a number, or nothing when it is left empty. */
const asNumber = (value: string): number | null => (value === "" ? null : Number(value));

/** A date input's text, or nothing when it is cleared. */
const asDay = (value: string): string | null => value || null;

/** One run's facts, each optional: the form is as short as the run was simple. */
export const PlaythroughForm = ({ form, platforms, onSubmit, onCancel, isPending, error, heading }: PlaythroughFormProps) => {
  const { register, setValue, control, formState } = form;
  const platformId = useWatch({ control, name: "platformId" });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-ink">{heading}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {platforms.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-faint">Platform</span>
            <Dropdown
              value={platformId === null ? NO_PLATFORM : String(platformId)}
              onChange={(next) => setValue("platformId", next === NO_PLATFORM ? null : Number(next), { shouldDirty: true })}
              options={[
                { value: NO_PLATFORM, label: "Not set" },
                ...platforms.map((platform) => ({ value: String(platform.id), label: platform.name })),
              ]}
            />
          </div>
        )}
        <Input
          label="Difficulty"
          placeholder="Hard, New Game+"
          error={formState.errors.difficulty?.message}
          {...register("difficulty")}
        />
        <Input
          label="Started"
          type="date"
          error={formState.errors.startedAt?.message}
          {...register("startedAt", { setValueAs: asDay })}
        />
        <Input
          label="Finished"
          type="date"
          error={formState.errors.completedAt?.message}
          {...register("completedAt", { setValueAs: asDay })}
        />
        <Input
          label="Hours"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          error={formState.errors.hours?.message}
          {...register("hours", { setValueAs: asNumber })}
        />
        <Input
          label="Score"
          type="number"
          inputMode="decimal"
          min={0}
          max={10}
          step={0.1}
          error={formState.errors.score?.message}
          {...register("score", { setValueAs: asNumber })}
        />
      </div>

      <Textarea label="Notes" placeholder="What made this run different." rows={2} error={formState.errors.notes?.message} {...register("notes")} />

      {error && <FormError message={error} />}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving" : "Save playthrough"}
        </Button>
      </div>
    </form>
  );
};

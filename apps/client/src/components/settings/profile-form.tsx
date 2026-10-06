"use client";

import { Plus, Trash2 } from "lucide-react";
import { OwnProfile } from "services";
import { Button, FormError, Input, Textarea } from "ui";
import { useProfileForm } from "@/app/(app)/settings/profile/use-profile-form";

type ProfileFormProps = {
  profile: OwnProfile;
};

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const {
    form: {
      register,
      formState: { errors },
    },
    links,
    state,
    isPending,
    onSubmit,
  } = useProfileForm(profile);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-card border border-hairline bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Profile</h2>
        <p className="text-sm text-muted">
          Shown on <span className="font-mono text-secondary">/@{profile.username}</span>.
          The avatar and banner come in a later step.
        </p>
      </div>

      <Input
        label="Display name"
        autoComplete="name"
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <Textarea
        label="Bio"
        rows={3}
        placeholder="A line or two about what you watch, play and read."
        error={errors.bio?.message}
        {...register("bio")}
      />

      <Input
        label="Location"
        placeholder="Riyadh"
        error={errors.location?.message}
        {...register("location")}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium text-ink">Links</legend>
        {links.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_2fr_auto] items-start gap-2">
            <Input
              placeholder="Label"
              error={errors.links?.[index]?.label?.message}
              {...register(`links.${index}.label`)}
            />
            <Input
              placeholder="https://"
              type="url"
              error={errors.links?.[index]?.url?.message}
              {...register(`links.${index}.url`)}
            />
            <Button
              variant="icon"
              aria-label="Remove link"
              onClick={() => links.remove(index)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        {links.fields.length < 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => links.append({ label: "", url: "" })}
          >
            <Plus size={14} />
            Add a link
          </Button>
        )}
        <FormError message={errors.links?.message} />
      </fieldset>

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

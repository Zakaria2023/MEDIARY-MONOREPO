"use client";

import { Plus, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button, Dropdown, FormError, Input, Textarea } from "ui";
import { CreatorCategory, creatorCategories } from "@/db/enum";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";
import { FieldLabel } from "@/components/studio/field-label";
import { useCreatorRequest } from "@/app/(app)/studio/use-creator-request";

type CreatorRequestFormProps = {
  /** The last request, when it was refused or revoked, to start from. */
  previous: { category: CreatorCategory } | null;
};

const CATEGORY_OPTIONS = creatorCategories.map((value) => ({ value, label: CREATOR_CATEGORY_LABELS[value] }));

/** Asking to be verified: what kind of creator, which channels are yours, and anything staff should know. */
export const CreatorRequestForm = ({ previous }: CreatorRequestFormProps) => {
  const {
    form: { register, control, formState },
    proofs,
    state,
    isPending,
    onSubmit,
  } = useCreatorRequest(previous);
  const errors = formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Ask to be verified</h2>
        <p className="text-sm text-muted">
          Name the channels or pages that are yours. Once you send this, you get a short code to put in the bio of one of them;
          staff look for it there, then decide. It is free, and it always will be.
        </p>
      </div>

      <FieldLabel label="What you make">
        <Controller
          control={control}
          name="category"
          render={({ field }) => <Dropdown value={field.value} onChange={field.onChange} options={CATEGORY_OPTIONS} />}
        />
      </FieldLabel>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium text-ink">Your channels</legend>
        {proofs.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_auto] items-start gap-2">
            <Input
              placeholder="https://www.youtube.com/@you"
              type="url"
              aria-label={`Channel ${index + 1}`}
              error={errors.proofUrls?.[index]?.url?.message}
              {...register(`proofUrls.${index}.url`)}
            />
            <Button variant="icon" aria-label="Remove channel" onClick={() => proofs.remove(index)} disabled={proofs.fields.length === 1}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        {proofs.fields.length < 5 && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => proofs.append({ url: "" })}>
            <Plus size={14} />
            Add a channel
          </Button>
        )}
        <FormError message={errors.proofUrls?.message ?? errors.proofUrls?.root?.message} />
      </fieldset>

      <Textarea
        label="Anything staff should know"
        placeholder="Optional: where you post most, or another way to reach you on a channel."
        rows={3}
        error={errors.note?.message}
        {...register("note")}
      />

      <FormError message={state.error} />
      <div className="flex justify-end border-t border-hairline pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending" : "Send request"}
        </Button>
      </div>
    </form>
  );
};

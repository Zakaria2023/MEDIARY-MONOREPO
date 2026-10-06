"use client";

import { Button, FormError, Input } from "ui";
import { useDeleteAccountForm } from "@/app/(app)/settings/account/use-delete-account-form";

/**
 * Delete the account. Typed confirmation rather than a click, because it
 * cannot be undone: the profile, the settings and everything tracked go.
 */
export const DeleteAccountForm = () => {
  const { form, state, isPending, onSubmit } = useDeleteAccountForm();

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-card border border-danger/30 bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-danger">Delete account</h2>
        <p className="text-sm text-muted">
          Your profile, settings and everything you have tracked are removed for good. This
          cannot be undone.
        </p>
      </div>
      <Input
        label="Type delete to confirm"
        autoComplete="off"
        error={form.formState.errors.confirmation?.message}
        {...form.register("confirmation")}
      />
      <FormError message={state.error} />
      <div>
        <Button type="submit" variant="danger" disabled={isPending}>
          {isPending ? "Deleting" : "Delete my account"}
        </Button>
      </div>
    </form>
  );
};

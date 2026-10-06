"use client";

import { PasswordInput } from "auth";
import { CircleCheck } from "lucide-react";
import { Button, FormError } from "ui";
import { PASSWORD_MIN_LENGTH } from "validators";
import { useChangePasswordForm } from "@/app/(app)/settings/account/use-change-password-form";

type ChangePasswordFormProps = {
  /** False for an account that signed up with Google and has never set one. */
  hasPassword: boolean;
};

/** Change the password, or set a first one. Every other device is signed out. */
export const ChangePasswordForm = ({ hasPassword }: ChangePasswordFormProps) => {
  const { form, state, isPending, onSubmit } = useChangePasswordForm();
  const { errors } = form.formState;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">
          {hasPassword ? "Change password" : "Set a password"}
        </h2>
        <p className="text-sm text-muted">
          At least {PASSWORD_MIN_LENGTH} characters. Your other devices are signed out when it
          changes.
        </p>
      </div>
      {hasPassword && (
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...form.register("currentPassword")}
        />
      )}
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...form.register("newPassword")}
      />
      <FormError message={state.error} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving" : hasPassword ? "Change password" : "Set password"}
        </Button>
        {state.success && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
            <CircleCheck size={16} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
};

"use client";

import { AtSign, Check, Loader2, X } from "lucide-react";
import { Button, FormError, Input } from "ui";
import { useWelcomeForm } from "@/app/(onboarding)/welcome/use-welcome-form";

type WelcomeFormProps = {
  suggestedUsername: string;
  displayName: string;
};

export const WelcomeForm = ({
  suggestedUsername,
  displayName,
}: WelcomeFormProps) => {
  const {
    form: {
      register,
      formState: { errors },
    },
    state,
    isPending,
    onSubmit,
    availability,
  } = useWelcomeForm({ username: suggestedUsername, displayName });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-card border border-hairline bg-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome to Mediary
        </h1>
        <p className="text-sm text-muted">
          Pick the handle your profile lives at. You can change your name any
          time; the handle is harder to change, so choose one you like.
        </p>
      </div>

      <Input
        label="Username"
        icon={<AtSign size={15} />}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        rightSlot={
          availability === "checking" ? (
            <Loader2 size={16} className="animate-spin text-faint" />
          ) : availability === "available" ? (
            <Check size={16} className="text-success" />
          ) : availability === "taken" ? (
            <X size={16} className="text-danger" />
          ) : null
        }
        error={
          errors.username?.message ??
          (availability === "taken" ? "That username is taken" : undefined)
        }
        {...register("username")}
      />

      <Input
        label="Display name"
        autoComplete="name"
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <FormError message={state.error} />

      <Button
        type="submit"
        size="lg"
        disabled={isPending || availability === "taken"}
        className="w-full"
      >
        {isPending ? "Saving" : "Start tracking"}
      </Button>
    </form>
  );
};

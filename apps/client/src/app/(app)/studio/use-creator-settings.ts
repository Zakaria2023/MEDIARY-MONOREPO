"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { CreatorSettingsInput, creatorSettingsSchema } from "validators";
import { updateCreatorSettingsAction } from "./actions";

/** A verified creator's own settings: the category on their badge and whether the directory lists them. */
export const useCreatorSettings = (initial: CreatorSettingsInput) => {
  const [state, dispatch, isPending] = useActionState(updateCreatorSettingsAction, {});

  const form = useForm<CreatorSettingsInput>({
    resolver: zodResolver(creatorSettingsSchema),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

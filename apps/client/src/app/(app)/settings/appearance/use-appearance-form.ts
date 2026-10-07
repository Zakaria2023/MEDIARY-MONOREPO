"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { appearanceSchema, AppearanceInput } from "validators";
import { saveAppearance } from "./actions";

/** The appearance form: a theme and a motion choice, saved on Save. */
export const useAppearanceForm = (initial: AppearanceInput) => {
  const [state, dispatch, isPending] = useActionState(saveAppearance, {});

  const form = useForm<AppearanceInput>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

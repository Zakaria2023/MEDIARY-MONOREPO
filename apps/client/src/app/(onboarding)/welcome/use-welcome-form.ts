"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "ui";
import { welcomeSchema, WelcomeInput } from "validators";
import { checkUsername, finishWelcome } from "./actions";

type Availability = "unknown" | "checking" | "available" | "taken";

/** The last answer the server gave, and which handle it was about. */
type Checked = {
  username: string;
  available: boolean;
};

/**
 * The welcome form's behaviour: the form, the save, and a debounced
 * availability check that runs as the handle is typed so "taken" is said
 * before Save, not after.
 *
 * The availability is DERIVED, not stored: the only state is the server's
 * last answer, and "checking" means the typed handle is valid and is not the
 * one that answer was about. The effect only fires the request.
 */
export const useWelcomeForm = (defaults: WelcomeInput) => {
  const [state, dispatch, isPending] = useActionState(finishWelcome, {});
  const [checked, setChecked] = useState<Checked | null>(null);

  const form = useForm<WelcomeInput>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  // useWatch rather than form.watch: the compiler cannot memoize watch()
  // safely, and a subscription is what this is.
  const username = useWatch({ control: form.control, name: "username" });
  const isValid = welcomeSchema.shape.username.safeParse(username).success;

  const check = useDebouncedCallback(async (value: string) => {
    const available = await checkUsername(value);
    setChecked({ username: value, available });
  }, 350);

  // Not while saving: a check answered after the save would find the handle
  // on the person's own row and say "taken" under a form that succeeded.
  useEffect(() => {
    if (isValid && !isPending) {
      check(username);
    }
  }, [username, isValid, isPending, check]);

  const availability: Availability = !isValid
    ? "unknown"
    : checked?.username === username
      ? checked.available
        ? "available"
        : "taken"
      : "checking";

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit, availability };
};

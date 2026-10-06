"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { PrivacySettings } from "services";
import { privacySchema, PrivacyInput } from "validators";
import { savePrivacy } from "./actions";

export const usePrivacyForm = (settings: PrivacySettings) => {
  const [state, dispatch, isPending] = useActionState(savePrivacy, {});

  const form = useForm<PrivacyInput>({
    resolver: zodResolver(privacySchema),
    defaultValues: settings,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

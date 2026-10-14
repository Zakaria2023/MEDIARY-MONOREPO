"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { StoreLinkInput, storeLinkSchema } from "validators";
import { saveStoreLinkAction } from "./actions";

/** Adding a store link to a title, or replacing one store's link. The form clears after a save. */
export const useStoreLinkForm = (mediaUuid: string) => {
  const [state, dispatch, isPending] = useActionState(saveStoreLinkAction, {});

  const form = useForm<StoreLinkInput>({
    resolver: zodResolver(storeLinkSchema),
    defaultValues: { mediaUuid, store: "steam", kind: "buy", url: "" },
  });

  useEffect(() => {
    if (state.success) {
      form.reset({ ...form.getValues(), url: "" });
    }
  }, [state, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ChangePasswordInput, changePasswordSchema } from "validators";
import { changePasswordAction } from "./actions";

/** Change (or, for a Google-only account, set) the password. */
export const useChangePasswordForm = () => {
  const [state, dispatch, isPending] = useActionState(changePasswordAction, {});

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  // A saved password must not linger in the fields.
  useEffect(() => {
    if (state.success) {
      form.reset({ currentPassword: "", newPassword: "" });
    }
  }, [state, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { DeleteAccountInput, deleteAccountSchema } from "validators";
import { deleteAccountAction } from "./actions";

/** Delete the account, confirmed by typing "delete". */
export const useDeleteAccountForm = () => {
  const [state, dispatch, isPending] = useActionState(deleteAccountAction, {});

  const form = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

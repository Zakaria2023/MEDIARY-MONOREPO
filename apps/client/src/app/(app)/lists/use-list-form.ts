"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { ListInput, listSchema } from "validators";
import { createListAction } from "./actions";

/** The new-list form on the lists page. A success is a redirect to the list. */
export const useListForm = () => {
  const [state, dispatch, isPending] = useActionState(createListAction, {});

  const form = useForm<ListInput>({
    resolver: zodResolver(listSchema),
    defaultValues: { name: "", description: "", visibility: "public" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

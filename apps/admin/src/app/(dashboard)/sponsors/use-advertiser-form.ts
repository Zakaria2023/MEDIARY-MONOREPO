"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AdvertiserInput, advertiserSchema } from "validators";
import { createAdvertiserAction } from "./actions";

const EMPTY: AdvertiserInput = { displayName: "", legalName: "", contactEmail: "", billingReference: "" };

/** The new-advertiser form; it clears after a save. */
export const useAdvertiserForm = () => {
  const [state, dispatch, isPending] = useActionState(createAdvertiserAction, {});

  const form = useForm<AdvertiserInput>({
    resolver: zodResolver(advertiserSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (state.success) {
      form.reset(EMPTY);
    }
  }, [state, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

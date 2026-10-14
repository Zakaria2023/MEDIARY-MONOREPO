"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PlacementInput, placementSchema } from "validators";
import { addPlacementAction } from "./actions";

/** A new placement: the title, the screen, the words and the weight. It clears after a save. */
export const usePlacementForm = (campaignUuid: string) => {
  const [state, dispatch, isPending] = useActionState(addPlacementAction, {});

  const form = useForm<PlacementInput>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      campaignUuid,
      title: "",
      surface: "explore",
      headline: "",
      body: "",
      ctaLabel: "See the title",
      destinationUrl: "",
      weight: 1,
    },
  });

  useEffect(() => {
    if (state.success) {
      form.reset();
    }
  }, [state, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

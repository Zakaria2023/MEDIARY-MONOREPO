"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { CreatorRequestInput, creatorRequestSchema } from "validators";
import { CreatorCategory } from "@/db/enum";
import { requestCreatorAction } from "./actions";

/** The request form: a kind of creator, up to five channels, a note. A success shows the code to post. */
export const useCreatorRequest = (previous: { category: CreatorCategory } | null) => {
  const [state, dispatch, isPending] = useActionState(requestCreatorAction, {});

  const form = useForm<CreatorRequestInput>({
    resolver: zodResolver(creatorRequestSchema),
    defaultValues: { category: previous?.category ?? "video", proofUrls: [{ url: "" }], note: "" },
  });
  const proofs = useFieldArray({ control: form.control, name: "proofUrls" });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, proofs, state, isPending, onSubmit };
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CreatorInviteInput, creatorInviteSchema } from "validators";
import { inviteCreatorAction } from "./actions";

/** Inviting a verified creator by handle, with the work asked and the disclosure it will carry. */
export const useInviteCreator = (campaignUuid: string, sponsor: string) => {
  const [state, dispatch, isPending] = useActionState(inviteCreatorAction, {});

  const form = useForm<CreatorInviteInput>({
    resolver: zodResolver(creatorInviteSchema),
    defaultValues: {
      campaignUuid,
      username: "",
      deliverables: "",
      disclosure: `This list was made with ${sponsor}, who paid for it. The picks and the words are the creator's own.`,
    },
  });

  useEffect(() => {
    if (state.success) {
      form.reset({ ...form.getValues(), username: "", deliverables: "" });
    }
  }, [state, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};

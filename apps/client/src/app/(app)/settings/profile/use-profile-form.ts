"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { OwnProfile } from "services";
import { profileSchema, ProfileInput } from "validators";
import { saveProfile } from "./actions";

export const useProfileForm = (profile: OwnProfile) => {
  const [state, dispatch, isPending] = useActionState(saveProfile, {});

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.displayName,
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      links: profile.links,
    },
  });

  const links = useFieldArray({ control: form.control, name: "links" });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, links, state, isPending, onSubmit };
};

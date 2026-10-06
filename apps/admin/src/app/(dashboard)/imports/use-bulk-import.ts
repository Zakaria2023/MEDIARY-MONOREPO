"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BulkImportInput, bulkImportSchema } from "validators";
import { ImportSource } from "@/lib/import-sources";
import { bulkImportAction } from "./actions";

/**
 * The bulk import: a provider's trending, popular or upcoming list, one to
 * five pages of twenty. The action runs the whole import and answers with
 * the tally, which the form shows under itself.
 */
export const useBulkImport = (sources: ImportSource[]) => {
  const start = sources.find((entry) => entry.configured) ?? sources[0];
  if (!start) {
    throw new Error("No catalog source is registered");
  }
  const [state, dispatch, isPending] = useActionState(bulkImportAction, {});

  const form = useForm<BulkImportInput>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      provider: start.provider,
      mediaType: start.mediaType,
      list: "trending",
      pages: 1,
    },
  });
  const provider = useWatch({ control: form.control, name: "provider" });
  const mediaType = useWatch({ control: form.control, name: "mediaType" });
  const source = sources.find((entry) => entry.value === `${provider}:${mediaType}`) ?? start;

  const onSourceChange = (value: string) => {
    const next = sources.find((entry) => entry.value === value);
    if (next) {
      form.setValue("provider", next.provider);
      form.setValue("mediaType", next.mediaType);
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit, source, onSourceChange };
};

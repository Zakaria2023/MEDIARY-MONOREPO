"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ActionResult } from "utils";
import { importUploadSchema } from "validators";
import { previewImportAction } from "./actions";

/** The form's fields: the source, and the file as the input hands it over. */
type UploadFields = {
  source: z.infer<typeof importUploadSchema>["source"];
  file: FileList;
};

/** The source alone goes through zod; the file is checked where it is read. */
const uploadFieldsSchema = importUploadSchema.pick({ source: true }).extend({
  file: z.custom<FileList>((value) => value instanceof FileList && value.length === 1, "Choose a file"),
});

/**
 * The upload form: a source and a file, sent as FormData because a file
 * cannot travel as JSON. A success is a redirect to the preview.
 */
export const useImportUpload = () => {
  const [state, dispatch, isPending] = useActionState<ActionResult, FormData>(previewImportAction, {});

  const form = useForm<UploadFields>({
    resolver: zodResolver(uploadFieldsSchema),
    defaultValues: { source: "mal" },
  });

  const onSubmit = form.handleSubmit((values) => {
    const file = values.file.item(0);
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.set("source", values.source);
    formData.set("file", file);
    startTransition(() => {
      dispatch(formData);
    });
  });

  return { form, state, isPending, onSubmit };
};

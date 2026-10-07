"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { ReportInput, reportSchema } from "validators";
import { reportAction } from "@/app/(app)/feed/actions";

/** The report dialog for anything: a reason, a note, and one send. */
export const useReport = (subject: Pick<ReportInput, "kind" | "uuid">) => {
  const [open, setOpen] = useState(false);
  const [state, dispatch, isPending] = useActionState(reportAction, {});

  const form = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: { ...subject, reason: "spam", note: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { open, setOpen, form, state, isPending, onSubmit };
};

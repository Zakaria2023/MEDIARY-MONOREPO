"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { ReportReviewInput, reportReviewSchema } from "validators";
import { reportReviewAction } from "./actions";

/** The report dialog: a reason, a note, and one send. */
export const useReportReview = (reviewUuid: string) => {
  const [open, setOpen] = useState(false);
  const [state, dispatch, isPending] = useActionState(reportReviewAction, {});

  const form = useForm<ReportReviewInput>({
    resolver: zodResolver(reportReviewSchema),
    defaultValues: { reviewUuid, reason: "spoilers", note: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { open, setOpen, form, state, isPending, onSubmit };
};

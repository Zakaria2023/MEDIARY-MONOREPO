"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { SponsorReportInput, sponsorReportSchema } from "validators";
import { reportSponsoredAction } from "@/app/(site)/explore/actions";

/** "Not for me" on a sponsored placement: an optional word on why, and one send. */
export const useSponsorReport = (placementUuid: string) => {
  const [open, setOpen] = useState(false);
  const [state, dispatch, isPending] = useActionState(reportSponsoredAction, {});

  const form = useForm<SponsorReportInput>({
    resolver: zodResolver(sponsorReportSchema),
    defaultValues: { placementUuid, note: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { open, setOpen, form, state, isPending, onSubmit };
};

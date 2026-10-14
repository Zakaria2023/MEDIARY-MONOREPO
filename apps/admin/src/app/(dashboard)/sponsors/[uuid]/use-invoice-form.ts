"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { InvoiceInput, invoiceSchema } from "validators";
import { addInvoiceAction } from "./actions";

/** A new invoice for the campaign, in its currency. It clears after a save. */
export const useInvoiceForm = (campaignUuid: string) => {
  const [state, dispatch, isPending] = useActionState(addInvoiceAction, {});

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { campaignUuid, number: "", amount: "", dueOn: "" },
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

"use client";

import { useState, useTransition } from "react";
import { InvoiceStatus } from "@/db/enum";
import { setInvoiceStatusAction } from "./actions";

/** One invoice's next steps: issued, paid, or voided. */
export const useInvoiceRow = (invoiceUuid: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onStatus = (status: InvoiceStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await setInvoiceStatusAction({ invoiceUuid, status });
      if (!result.success) {
        setError(result.error ?? "Could not change the invoice");
      }
    });
  };

  return { error, isPending, onStatus };
};

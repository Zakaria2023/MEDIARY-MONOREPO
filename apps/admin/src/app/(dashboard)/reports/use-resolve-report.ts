"use client";

import { useState, useTransition } from "react";
import { ReportAction } from "services";
import { resolveReportAction } from "./actions";

/** One report's two buttons: the row disappears at once and comes back if refused. */
export const useResolveReport = (reportUuid: string) => {
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onResolve = (action: ReportAction) => {
    setResolved(true);
    setError(null);
    startTransition(async () => {
      const result = await resolveReportAction({ reportUuid, action });
      if (!result.success) {
        setResolved(false);
        setError(result.error ?? "Could not close this report");
      }
    });
  };

  return { resolved, error, isPending, onResolve };
};

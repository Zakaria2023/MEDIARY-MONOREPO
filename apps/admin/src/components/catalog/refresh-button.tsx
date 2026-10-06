"use client";

import { Check, RefreshCw } from "lucide-react";
import { Button, FormError } from "ui";
import { useRefreshTitle } from "@/app/(dashboard)/catalog/[uuid]/use-refresh-title";

type RefreshButtonProps = {
  uuid: string;
};

/** Re-fetch this title now, instead of waiting for the daily refresh. */
export const RefreshButton = ({ uuid }: RefreshButtonProps) => {
  const { state, isPending, onRefresh } = useRefreshTitle(uuid);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="outline" onClick={onRefresh} disabled={isPending}>
        {state.success && !isPending ? (
          <Check size={16} className="text-success" />
        ) : (
          <RefreshCw size={16} className={isPending ? "animate-spin" : undefined} />
        )}
        {isPending ? "Refreshing" : state.success ? "Refreshed" : "Refresh from source"}
      </Button>
      <FormError message={state.error} />
    </div>
  );
};

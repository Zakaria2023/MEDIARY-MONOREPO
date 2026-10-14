"use client";

import { RefreshCw } from "lucide-react";
import { Button, FormError } from "ui";
import { useCheckLinks } from "@/app/(dashboard)/commerce/use-check-links";

/** Asks the stores about the twenty links checked longest ago, and says what came back. */
export const CheckLinksButton = () => {
  const { state, isPending, onCheck } = useCheckLinks();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="outline" onClick={onCheck} disabled={isPending}>
        <RefreshCw size={16} className={isPending ? "animate-spin" : undefined} />
        {isPending ? "Checking" : "Check links"}
      </Button>
      {state.summary && !isPending && (
        <p className="text-xs text-muted">
          Checked {state.summary.checked}; {state.summary.broken === 0 ? "none look broken" : `${state.summary.broken} look broken`}.
        </p>
      )}
      <FormError message={state.error} />
    </div>
  );
};

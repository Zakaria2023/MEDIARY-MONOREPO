"use client";

import { startTransition, useActionState } from "react";
import { LibraryImport } from "services";
import { applyImportAction } from "../actions";

/** The preview's Import button: one press, then the result in place. */
export const useApplyImport = (initial: LibraryImport) => {
  const [state, dispatch, isPending] = useActionState(applyImportAction, {});

  const onApply = () => {
    startTransition(() => {
      dispatch({ importUuid: initial.uuid });
    });
  };

  return {
    summary: state.summary ?? initial,
    error: state.error,
    isPending,
    onApply,
  };
};

"use client";

import { startTransition, useActionState } from "react";
import { bringInMoreRecordsAction } from "./actions";

/**
 * MORE OF AN ARTIST'S RECORDS: one press brings in the next ten the
 * catalog has and Mediary does not, and the page re-renders with them.
 * What the press did is said in words, including that there is nothing left.
 */
export const useMoreRecords = (artistUuid: string) => {
  const [state, dispatch, isPending] = useActionState(bringInMoreRecordsAction, {});

  const onBring = () => {
    startTransition(() => {
      dispatch(artistUuid);
    });
  };

  const done = state.added !== undefined && state.remaining === 0;
  const outcome =
    state.added === undefined
      ? null
      : state.added === 0 && state.remaining === 0
        ? "Mediary has every album and EP of theirs."
        : `Brought in ${state.added} ${state.added === 1 ? "record" : "records"}.${state.remaining ? " There are more." : ""}`;

  return { onBring, isPending, done, outcome, error: state.error };
};

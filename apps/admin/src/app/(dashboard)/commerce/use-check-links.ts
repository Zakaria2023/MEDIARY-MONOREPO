"use client";

import { startTransition, useActionState } from "react";
import { checkStoreLinksAction } from "./actions";

/** The check button: one run, its pending state and what it found. */
export const useCheckLinks = () => {
  const [state, dispatch, isPending] = useActionState(checkStoreLinksAction, {});

  const onCheck = () => {
    startTransition(() => {
      dispatch();
    });
  };

  return { state, isPending, onCheck };
};

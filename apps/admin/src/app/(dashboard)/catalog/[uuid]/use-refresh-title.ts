"use client";

import { startTransition, useActionState } from "react";
import { refreshTitleAction } from "./actions";

/** The Refresh button: one action, its pending state and its answer. */
export const useRefreshTitle = (uuid: string) => {
  const [state, dispatch, isPending] = useActionState(refreshTitleAction, {});

  const onRefresh = () => {
    startTransition(() => {
      dispatch(uuid);
    });
  };

  return { state, isPending, onRefresh };
};

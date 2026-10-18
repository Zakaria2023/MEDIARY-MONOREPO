"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardEvent, startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { guideMessageSchema, GuideMessageInput } from "validators";
import { askGuideAction } from "./actions";

/**
 * THE CONVERSATION ON /ask. The thread lives in the action's state and goes
 * back to the server with each message; the message being answered shows
 * at once, before the reply. Enter sends, Shift+Enter breaks the line.
 */
export const useGuideChat = () => {
  const [state, dispatch, isPending] = useActionState(askGuideAction, { turns: [] });
  const [waiting, setWaiting] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const form = useForm<GuideMessageInput>({
    resolver: zodResolver(guideMessageSchema),
    defaultValues: { message: "" },
  });

  const ask = (message: string) => {
    setWaiting(message);
    form.reset({ message: "" });
    startTransition(() => {
      dispatch({ message });
    });
  };

  const onSubmit = form.handleSubmit(({ message }) => {
    ask(message);
  });

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void onSubmit();
    }
  };

  const retry = () => {
    if (state.unsent) {
      ask(state.unsent);
    }
  };

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [state.turns.length, isPending]);

  return {
    form,
    state,
    isPending,
    waiting: isPending ? waiting : null,
    onSubmit,
    onKeyDown,
    ask,
    retry,
    endRef,
  };
};

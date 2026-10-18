import { useSyncExternalStore } from "react";

/** One message at the bottom of the screen. */
export type Toast = {
  id: number;
  message: string;
  tone: "info" | "error";
};

/** How long a message stays before it goes by itself. */
const TOAST_MS = 4000;

let current: Toast | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

/** Takes the message down now, before its time is up. */
export const dismissToast = () => {
  current = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  emit();
};

/**
 * A SENTENCE AFTER THE FACT: what a write that already left the screen has
 * to say, such as a save that the server refused after the sheet closed.
 * One at a time; a new one replaces the last.
 */
export const showToast = (message: string, tone: Toast["tone"] = "info") => {
  current = { id: nextId++, message, tone };
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(dismissToast, TOAST_MS);
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The message on screen now, or null. */
export const useToast = (): Toast | null => useSyncExternalStore(subscribe, () => current, () => null);

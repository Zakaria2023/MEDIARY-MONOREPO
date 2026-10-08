"use client";

import { ArrowUp } from "lucide-react";
import { FormEventHandler, KeyboardEvent } from "react";
import { UseFormReturn } from "react-hook-form";
import { GuideMessageInput } from "validators";

type GuideComposerProps = {
  form: UseFormReturn<GuideMessageInput>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isPending: boolean;
};

/** The message box, pinned under the thread: grows with what is written, sends on Enter. */
export const GuideComposer = ({ form: { register, formState }, onSubmit, onKeyDown, isPending }: GuideComposerProps) => (
  <form
    onSubmit={onSubmit}
    className="sticky bottom-14 z-20 -mx-1 bg-page px-1 pb-4 pt-2 sm:bottom-0 sm:pb-6"
  >
    <div className="flex items-end gap-2 rounded-card border border-hairline-strong bg-surface p-2 transition-colors focus-within:border-accent">
      <label htmlFor="guide-message" className="sr-only">
        Message the guide
      </label>
      <textarea
        id="guide-message"
        rows={1}
        placeholder="Ask for something to watch, play, read or hear"
        onKeyDown={onKeyDown}
        className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-placeholder"
        {...register("message")}
      />
      <button
        type="submit"
        disabled={isPending}
        aria-label="Send"
        className="flex size-10 shrink-0 items-center justify-center rounded-control bg-action-gradient text-white disabled:opacity-60"
      >
        <ArrowUp size={18} />
      </button>
    </div>
    {formState.errors.message && <p className="mt-2 text-xs text-danger">{formState.errors.message.message}</p>}
  </form>
);

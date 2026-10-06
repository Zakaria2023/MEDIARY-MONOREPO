"use client";

import { forwardRef, ReactNode, TextareaHTMLAttributes, useId } from "react";
import { FormError } from "./form-error";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  labelIcon?: ReactNode;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, labelIcon, error, id, name, required, className = "", ...props },
    ref,
  ) => {
    // Same fallback, same reasoning as Input — see the note there.
    const fallbackId = useId();
    const textareaId = id ?? name ?? fallbackId;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="flex items-center gap-2 text-sm font-medium text-ink"
          >
            {labelIcon && <span className="text-accent">{labelIcon}</span>}
            {label}
            {required && <span className="text-accent">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          required={required}
          className={`w-full rounded-control border border-hairline-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-tint ${className}`}
          {...props}
        />

        <FormError message={error} />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

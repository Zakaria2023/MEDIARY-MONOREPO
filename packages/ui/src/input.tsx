"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { FormError } from "./form-error";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  labelIcon?: ReactNode;
  labelAccessory?: ReactNode;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  error?: string;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelIcon,
      labelAccessory,
      icon,
      rightSlot,
      error,
      wrapperClassName = "",
      id,
      name,
      required,
      className = "",
      ...props
    },
    ref,
  ) => {
    // A LABEL THAT POINTS AT NOTHING IS NOT A LABEL. This was `id ?? name`, and
    // roughly forty call sites pass neither — every one of them a `<label>` with
    // `htmlFor={undefined}` and an input no assistive technology could connect it
    // to. Tapping the word did not focus the field either.
    //
    // A generated fallback rather than a sweep adding `name` to all forty: a
    // `name` inside a `<form action={…}>` is a field in the FormData, so the
    // accessibility fix would have quietly changed what several server actions
    // receive. This adds an attribute nothing reads but the label.
    //
    // `useId` and not a counter or a random string, because the value has to
    // match between the server render and the client one or React discards the
    // markup — which is the whole reason this is the hook it is. It costs this
    // file a `"use client"`; every consumer already carries one, so nothing
    // moves across the boundary that was not there before.
    const fallbackId = useId();
    const inputId = id ?? name ?? fallbackId;

    return (
      <div className="flex flex-col gap-2">
        {(label || labelAccessory) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={inputId}
                className="flex items-center gap-2 text-sm font-medium text-ink"
              >
                {labelIcon && <span className="text-accent">{labelIcon}</span>}
                {label}
                {required && <span className="text-accent">*</span>}
              </label>
            )}
            {labelAccessory}
          </div>
        )}

        <div className={`relative ${wrapperClassName}`}>
          {icon && (
            <span className="pointer-events-none absolute top-1/2 inset-s-3 -translate-y-1/2 text-faint">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            required={required}
            className={`w-full rounded-control border border-hairline-strong bg-surface py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-tint ${
              icon ? "ps-9" : "ps-3.5"
            } ${rightSlot ? "pe-11" : "pe-3.5"} ${className}`}
            {...props}
          />

          {rightSlot && (
            <span className="absolute top-1/2 inset-e-3 -translate-y-1/2">
              {rightSlot}
            </span>
          )}
        </div>

        <FormError message={error} />
      </div>
    );
  },
);

Input.displayName = "Input";

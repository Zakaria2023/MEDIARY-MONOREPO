import type { ReactNode } from "react";

type SettingsFieldProps = {
  label: string;
  description: string;
  children: ReactNode;
};

/** A labelled row on a settings form: the words on the start, the control on the end. */
export const SettingsField = ({
  label,
  description,
  children,
}: SettingsFieldProps) => (
  <div className="grid gap-3 sm:grid-cols-[1fr_240px] sm:items-center">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="text-sm text-muted">{description}</span>
    </div>
    {children}
  </div>
);

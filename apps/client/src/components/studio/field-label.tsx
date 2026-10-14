import { ReactNode } from "react";

type FieldLabelProps = {
  label: string;
  children: ReactNode;
};

/** A control with its name above it, for the studio's fields that are not an Input. */
export const FieldLabel = ({ label, children }: FieldLabelProps) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-medium text-ink">{label}</span>
    {children}
  </div>
);

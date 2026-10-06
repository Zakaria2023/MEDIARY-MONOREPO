import { ReactNode } from "react";

type FieldLabelProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** A control with its name above it, for the fields that are not an Input. */
export const FieldLabel = ({ label, children, className = "" }: FieldLabelProps) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <span className="text-sm font-medium text-ink">{label}</span>
    {children}
  </div>
);

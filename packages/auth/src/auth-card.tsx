import { ReactNode } from "react";

type AuthCardProps = {
  heading: string;
  description?: string;
  children: ReactNode;
  /** A line under the card: "No account yet? Create one". */
  footer?: ReactNode;
};

/**
 * The frame of every sign-in, sign-up and reset step: a heading, a line of
 * explanation, the form, and the way to the other screen under it. A
 * hairline separates the card from the page; no shadow.
 */
export const AuthCard = ({ heading, description, children, footer }: AuthCardProps) => (
  <div className="flex w-full flex-col gap-5">
    <div className="flex flex-col gap-6 rounded-card border border-hairline bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold text-ink">{heading}</h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
    {footer && <div className="text-center text-sm text-muted">{footer}</div>}
  </div>
);

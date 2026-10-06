import { CircleAlert, MailCheck } from "lucide-react";

type AuthMessageProps = {
  error: string | null;
  notice: string | null;
};

/** The one line a step says about itself: an error in red, or a notice. Error wins. */
export const AuthMessage = ({ error, notice }: AuthMessageProps) => {
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-control bg-danger-tint px-3 py-2.5 text-sm text-danger">
        <CircleAlert size={16} className="mt-0.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-control bg-accent-tint px-3 py-2.5 text-sm text-ink">
        <MailCheck size={16} className="mt-0.5 shrink-0 text-accent" />
        {notice}
      </p>
    );
  }
  return null;
};

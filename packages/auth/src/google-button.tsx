import { Button } from "ui";

type GoogleButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
};

/** Sign in or up with a Google account: the outline button above the email form. */
export const GoogleButton = ({ label, disabled, onClick }: GoogleButtonProps) => (
  <Button
    variant="outline"
    size="lg"
    disabled={disabled}
    onClick={onClick}
    className="w-full justify-center"
  >
    <span className="font-display text-base font-semibold text-ink" aria-hidden="true">
      G
    </span>
    {label}
  </Button>
);

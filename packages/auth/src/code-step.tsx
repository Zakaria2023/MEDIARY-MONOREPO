import { ArrowLeft } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button, Input } from "ui";
import { CodeInput } from "validators";
import { AuthMessage } from "./auth-message";

type CodeStepProps = {
  form: UseFormReturn<CodeInput>;
  error: string | null;
  notice: string | null;
  isBusy: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
};

/**
 * Enter the six-digit code from the email. Shared by sign-in, sign-up and
 * the password reset, so a code looks and behaves the same everywhere.
 */
export const CodeStep = ({
  form,
  error,
  notice,
  isBusy,
  submitLabel,
  onSubmit,
  onResend,
  onBack,
}: CodeStepProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
    <AuthMessage error={error} notice={notice} />
    <Input
      label="Code"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      placeholder="123456"
      maxLength={7}
      className="font-mono text-lg tracking-widest"
      error={form.formState.errors.code?.message}
      {...form.register("code")}
    />
    <Button type="submit" size="lg" disabled={isBusy} className="w-full justify-center">
      {isBusy ? "Checking" : submitLabel}
    </Button>
    <div className="flex items-center justify-between text-sm">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1 text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Back
      </button>
      <button
        type="button"
        onClick={onResend}
        disabled={isBusy}
        className="cursor-pointer text-accent transition-colors hover:text-accent-hover disabled:opacity-60"
      >
        Send a new code
      </button>
    </div>
  </form>
);

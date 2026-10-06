"use client";

import Link from "next/link";
import { Button, Input } from "ui";
import { PASSWORD_MIN_LENGTH } from "validators";
import { AuthCard } from "./auth-card";
import { AuthMessage } from "./auth-message";
import { CodeStep } from "./code-step";
import { PasswordInput } from "./password-input";
import { useResetPasswordFlow } from "./use-reset-password-flow";

type ResetPasswordFormProps = {
  redirectTo: string;
  signInHref: string;
};

/** Forgot password: the email, the code, the new password. */
export const ResetPasswordForm = ({ redirectTo, signInHref }: ResetPasswordFormProps) => {
  const flow = useResetPasswordFlow({ redirectTo });
  const backToSignIn = (
    <>
      Remembered it?{" "}
      <Link href={signInHref} className="font-medium text-accent hover:text-accent-hover">
        Back to sign in
      </Link>
    </>
  );

  if (flow.step === "code") {
    return (
      <AuthCard heading="Check your email" description="Enter the code to choose a new password." footer={backToSignIn}>
        <CodeStep
          form={flow.codeForm}
          error={flow.error}
          notice={flow.notice}
          isBusy={flow.isBusy}
          submitLabel="Continue"
          onSubmit={flow.onCodeSubmit}
          onResend={flow.onResendCode}
          onBack={flow.onBack}
        />
      </AuthCard>
    );
  }

  if (flow.step === "password") {
    return (
      <AuthCard
        heading="Choose a new password"
        description="You will be signed in, and signed out everywhere else."
      >
        <form onSubmit={flow.onPasswordSubmit} className="flex flex-col gap-4" noValidate>
          <AuthMessage error={flow.error} notice={null} />
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            autoFocus
            error={flow.passwordForm.formState.errors.password?.message}
            {...flow.passwordForm.register("password")}
          />
          <p className="-mt-2 text-xs text-faint">At least {PASSWORD_MIN_LENGTH} characters.</p>
          <Button type="submit" size="lg" disabled={flow.isBusy} className="w-full justify-center">
            {flow.isBusy ? "Saving" : "Save and sign in"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="Reset your password"
      description="We will email you a code to choose a new one."
      footer={backToSignIn}
    >
      <form onSubmit={flow.onEmailSubmit} className="flex flex-col gap-4" noValidate>
        <AuthMessage error={flow.error} notice={null} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={flow.emailForm.formState.errors.email?.message}
          {...flow.emailForm.register("email")}
        />
        <Button type="submit" size="lg" disabled={flow.isBusy} className="w-full justify-center">
          {flow.isBusy ? "Sending" : "Send the code"}
        </Button>
      </form>
    </AuthCard>
  );
};

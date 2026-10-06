"use client";

import Link from "next/link";
import { Button, Input } from "ui";
import { AuthCard } from "./auth-card";
import { AuthDivider } from "./auth-divider";
import { AuthMessage } from "./auth-message";
import { CodeStep } from "./code-step";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { useSignInFlow } from "./use-sign-in-flow";

type SignInFormProps = {
  redirectTo: string;
  ssoCallbackPath: string;
  forgotPasswordHref: string;
  /** Null where there is no sign-up, as on the admin. */
  signUpHref: string | null;
  /**
   * False on the admin. A Google sign-in from an address with no account
   * quietly creates one, and the admin never creates accounts.
   */
  showGoogle?: boolean;
  heading?: string;
  description?: string;
};

/** Sign in: Google, or email and password, or a code by email. */
export const SignInForm = ({
  redirectTo,
  ssoCallbackPath,
  forgotPasswordHref,
  signUpHref,
  showGoogle = true,
  heading = "Welcome back",
  description = "Sign in to your Mediary.",
}: SignInFormProps) => {
  const flow = useSignInFlow({ redirectTo, ssoCallbackPath });
  const { errors } = flow.credentials.formState;

  if (flow.step === "code") {
    return (
      <AuthCard heading="Check your email" description="Enter the code to finish signing in.">
        <CodeStep
          form={flow.codeForm}
          error={flow.error}
          notice={flow.notice}
          isBusy={flow.isBusy}
          submitLabel="Sign in"
          onSubmit={flow.onCodeSubmit}
          onResend={flow.onResendCode}
          onBack={flow.onBack}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading={heading}
      description={description}
      footer={
        signUpHref ? (
          <>
            New to Mediary?{" "}
            <Link href={signUpHref} className="font-medium text-accent hover:text-accent-hover">
              Create your account
            </Link>
          </>
        ) : undefined
      }
    >
      {showGoogle && (
        <>
          <GoogleButton label="Continue with Google" disabled={flow.isBusy} onClick={flow.onGoogle} />
          <AuthDivider />
        </>
      )}
      <form onSubmit={flow.onPasswordSubmit} className="flex flex-col gap-4" noValidate>
        <AuthMessage error={flow.error} notice={null} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...flow.credentials.register("email")}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          labelAccessory={
            <Link href={forgotPasswordHref} className="text-xs text-accent hover:text-accent-hover">
              Forgot it?
            </Link>
          }
          {...flow.credentials.register("password")}
        />
        <Button type="submit" size="lg" disabled={flow.isBusy} className="w-full justify-center">
          {flow.isBusy ? "Signing in" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={flow.onRequestCode}
          disabled={flow.isBusy}
          className="cursor-pointer text-sm text-muted transition-colors hover:text-ink disabled:opacity-60"
        >
          Email me a sign-in code instead
        </button>
      </form>
    </AuthCard>
  );
};

"use client";

import Link from "next/link";
import { Button, Input } from "ui";
import { PASSWORD_MIN_LENGTH } from "validators";
import { AuthCard } from "./auth-card";
import { AuthDivider } from "./auth-divider";
import { AuthMessage } from "./auth-message";
import { CodeStep } from "./code-step";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { useSignUpFlow } from "./use-sign-up-flow";

type SignUpFormProps = {
  redirectTo: string;
  ssoCallbackPath: string;
  signInHref: string;
};

/** Create an account: Google, or an email and a password confirmed by a code. */
export const SignUpForm = ({ redirectTo, ssoCallbackPath, signInHref }: SignUpFormProps) => {
  const flow = useSignUpFlow({ redirectTo, ssoCallbackPath });
  const { errors } = flow.details.formState;

  if (flow.step === "verify") {
    return (
      <AuthCard heading="Confirm your email" description="Enter the code to create your account.">
        <CodeStep
          form={flow.codeForm}
          error={flow.error}
          notice={flow.notice}
          isBusy={flow.isBusy}
          submitLabel="Create my account"
          onSubmit={flow.onCodeSubmit}
          onResend={flow.onResendCode}
          onBack={flow.onBack}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="Create your Mediary"
      description="One profile for everything you watch, play and love."
      footer={
        <>
          Already have an account?{" "}
          <Link href={signInHref} className="font-medium text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" disabled={flow.isBusy} onClick={flow.onGoogle} />
      <AuthDivider />
      <form onSubmit={flow.onDetailsSubmit} className="flex flex-col gap-4" noValidate>
        <AuthMessage error={flow.error} notice={null} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...flow.details.register("email")}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          aria-describedby="password-hint"
          {...flow.details.register("password")}
        />
        <p id="password-hint" className="-mt-2 text-xs text-faint">
          At least {PASSWORD_MIN_LENGTH} characters. A short sentence is easy to remember.
        </p>
        {/* The bot check renders here; it is invisible for almost everyone. */}
        <div id="clerk-captcha" />
        <Button type="submit" size="lg" disabled={flow.isBusy} className="w-full justify-center">
          {flow.isBusy ? "Creating" : "Continue"}
        </Button>
      </form>
    </AuthCard>
  );
};

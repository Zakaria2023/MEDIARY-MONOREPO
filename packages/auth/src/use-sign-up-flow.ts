"use client";

import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CodeInput, codeSchema, SignUpInput, signUpSchema } from "validators";
import { authErrorMessage } from "./errors";
import { useFinishSession } from "./use-finish-session";

type SignUpStep = "details" | "verify";

type SignUpFlowOptions = {
  /** Where a new account goes once its email is confirmed: the welcome screen. */
  redirectTo: string;
  ssoCallbackPath: string;
};

/**
 * THE SIGN-UP FLOW, headless: an email and a password, then the six-digit
 * code that proves the email is theirs. The handle and the display name are
 * asked for afterwards, on Mediary's own welcome screen. The bot check the
 * identity service runs renders into the element with id `clerk-captcha`,
 * which the form keeps on the page.
 */
export const useSignUpFlow = ({ redirectTo, ssoCallbackPath }: SignUpFlowOptions) => {
  const { signUp, fetchStatus } = useSignUp();
  const finishTo = useFinishSession();
  const [step, setStep] = useState<SignUpStep>("details");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const details = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });
  const codeForm = useForm<CodeInput>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const onDetailsSubmit = details.handleSubmit(async ({ email, password }) => {
    setError(null);
    const { error: createError } = await signUp.password({ emailAddress: email, password });
    if (createError) {
      setError(authErrorMessage(createError, "We could not create your account. Try again."));
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setError(authErrorMessage(sendError, "We could not send the code. Try again."));
      return;
    }
    codeForm.reset({ code: "" });
    setNotice(`We sent a six-digit code to ${email}.`);
    setStep("verify");
  });

  const onCodeSubmit = codeForm.handleSubmit(async ({ code }) => {
    setError(null);
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
    if (verifyError) {
      setError(authErrorMessage(verifyError, "That code did not work. Try again."));
      return;
    }
    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: finishTo(redirectTo) });
      return;
    }
    setError("Your account needs one more detail we cannot collect here yet.");
  });

  const onResendCode = async () => {
    setError(null);
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    setNotice(sendError ? null : "We sent a new code.");
    if (sendError) {
      setError(authErrorMessage(sendError, "We could not send the code. Try again."));
    }
  };

  const onBack = () => {
    setError(null);
    setNotice(null);
    setStep("details");
  };

  const onGoogle = async () => {
    setError(null);
    const { error: ssoError } = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: redirectTo,
      redirectCallbackUrl: ssoCallbackPath,
    });
    if (ssoError) {
      setError(authErrorMessage(ssoError, "Google sign-up did not start. Try again."));
    }
  };

  return {
    step,
    details,
    codeForm,
    error,
    notice,
    isBusy: fetchStatus === "fetching" || details.formState.isSubmitting || codeForm.formState.isSubmitting,
    onDetailsSubmit,
    onCodeSubmit,
    onResendCode,
    onBack,
    onGoogle,
  };
};

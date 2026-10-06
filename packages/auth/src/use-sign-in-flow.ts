"use client";

import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CodeInput, codeSchema, SignInInput, signInSchema } from "validators";
import { authErrorMessage } from "./errors";
import { useFinishSession } from "./use-finish-session";

/** Where the flow is: the email and password, or a code from an email. */
type SignInStep = "credentials" | "code";

/** Why a code was sent: to sign in without a password, or to confirm a new device. */
type CodeReason = "sign_in" | "new_device";

type SignInFlowOptions = {
  /** Where a finished sign-in goes. */
  redirectTo: string;
  /** The path of the page that completes a Google sign-in. */
  ssoCallbackPath: string;
};

/**
 * THE SIGN-IN FLOW, headless. Email and password; or an emailed code in
 * place of the password; and, when the identity service does not yet trust
 * this browser, a code to confirm it. Every message the person reads comes
 * from authErrorMessage, so nothing the service says reaches the screen.
 */
export const useSignInFlow = ({ redirectTo, ssoCallbackPath }: SignInFlowOptions) => {
  const { signIn, fetchStatus } = useSignIn();
  const finishTo = useFinishSession();
  const [step, setStep] = useState<SignInStep>("credentials");
  const [codeReason, setCodeReason] = useState<CodeReason>("sign_in");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const credentials = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const codeForm = useForm<CodeInput>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  /** After a first factor: done, or one more code for a browser it does not know. */
  const continueAfterFirstFactor = async () => {
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: finishTo(redirectTo) });
      return;
    }
    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) {
        setError(authErrorMessage(sendError, "We could not send a code. Try again."));
        return;
      }
      codeForm.reset({ code: "" });
      setCodeReason("new_device");
      setNotice("This browser is new to your account. We sent a code to your email to confirm it is you.");
      setStep("code");
      return;
    }
    setError("This account needs a sign-in step Mediary does not support yet.");
  };

  const onPasswordSubmit = credentials.handleSubmit(async ({ email, password }) => {
    setError(null);
    const { error: signInError } = await signIn.password({ emailAddress: email, password });
    if (signInError) {
      setError(authErrorMessage(signInError, "We could not sign you in. Try again."));
      return;
    }
    await continueAfterFirstFactor();
  });

  /** "Email me a code instead": only the email field has to be valid. */
  const onRequestCode = async () => {
    setError(null);
    const valid = await credentials.trigger("email");
    if (!valid) {
      return;
    }
    const email = credentials.getValues("email").trim();
    const { error: createError } = await signIn.create({ identifier: email });
    if (createError) {
      setError(authErrorMessage(createError, "We could not start a sign-in for that email."));
      return;
    }
    const { error: sendError } = await signIn.emailCode.sendCode({ emailAddress: email });
    if (sendError) {
      setError(authErrorMessage(sendError, "We could not send a code. Try again."));
      return;
    }
    codeForm.reset({ code: "" });
    setCodeReason("sign_in");
    setNotice(`We sent a six-digit code to ${email}.`);
    setStep("code");
  };

  const onCodeSubmit = codeForm.handleSubmit(async ({ code }) => {
    setError(null);
    const { error: verifyError } =
      codeReason === "sign_in"
        ? await signIn.emailCode.verifyCode({ code })
        : await signIn.mfa.verifyEmailCode({ code });
    if (verifyError) {
      setError(authErrorMessage(verifyError, "That code did not work. Try again."));
      return;
    }
    await continueAfterFirstFactor();
  });

  const onResendCode = async () => {
    setError(null);
    const { error: sendError } =
      codeReason === "sign_in"
        ? await signIn.emailCode.sendCode()
        : await signIn.mfa.sendEmailCode();
    setNotice(sendError ? null : "We sent a new code.");
    if (sendError) {
      setError(authErrorMessage(sendError, "We could not send a code. Try again."));
    }
  };

  const onBack = () => {
    setError(null);
    setNotice(null);
    setStep("credentials");
  };

  const onGoogle = async () => {
    setError(null);
    const { error: ssoError } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: redirectTo,
      redirectCallbackUrl: ssoCallbackPath,
    });
    if (ssoError) {
      setError(authErrorMessage(ssoError, "Google sign-in did not start. Try again."));
    }
  };

  return {
    step,
    credentials,
    codeForm,
    error,
    notice,
    isBusy: fetchStatus === "fetching" || credentials.formState.isSubmitting || codeForm.formState.isSubmitting,
    onPasswordSubmit,
    onRequestCode,
    onCodeSubmit,
    onResendCode,
    onBack,
    onGoogle,
  };
};

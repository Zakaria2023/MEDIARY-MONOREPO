"use client";

import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  CodeInput,
  codeSchema,
  EmailInput,
  emailSchema,
  NewPasswordInput,
  newPasswordSchema,
} from "validators";
import { authErrorMessage } from "./errors";
import { useFinishSession } from "./use-finish-session";

type ResetStep = "email" | "code" | "password";

type ResetPasswordFlowOptions = {
  redirectTo: string;
};

/**
 * FORGOT PASSWORD, headless: the email, the code sent to it, then the new
 * password. Finishing signs the person in and signs every other device out,
 * because a reset is usually a sign that someone else may have the old one.
 */
export const useResetPasswordFlow = ({ redirectTo }: ResetPasswordFlowOptions) => {
  const { signIn, fetchStatus } = useSignIn();
  const finishTo = useFinishSession();
  const [step, setStep] = useState<ResetStep>("email");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<CodeInput>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });
  const passwordForm = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "" },
  });

  const onEmailSubmit = emailForm.handleSubmit(async ({ email }) => {
    setError(null);
    const { error: createError } = await signIn.create({ identifier: email });
    if (createError) {
      setError(authErrorMessage(createError, "We could not find an account for that email."));
      return;
    }
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setError(authErrorMessage(sendError, "We could not send the code. Try again."));
      return;
    }
    setNotice(`We sent a six-digit code to ${email}.`);
    setStep("code");
  });

  const onCodeSubmit = codeForm.handleSubmit(async ({ code }) => {
    setError(null);
    const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (verifyError) {
      setError(authErrorMessage(verifyError, "That code did not work. Try again."));
      return;
    }
    setNotice(null);
    setStep("password");
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async ({ password }) => {
    setError(null);
    const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });
    if (submitError) {
      setError(authErrorMessage(submitError, "We could not save that password. Try another."));
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: finishTo(redirectTo) });
      return;
    }
    setError("Your password is saved. Sign in with it to continue.");
  });

  const onResendCode = async () => {
    setError(null);
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    setNotice(sendError ? null : "We sent a new code.");
    if (sendError) {
      setError(authErrorMessage(sendError, "We could not send the code. Try again."));
    }
  };

  const onBack = () => {
    setError(null);
    setNotice(null);
    setStep("email");
  };

  return {
    step,
    emailForm,
    codeForm,
    passwordForm,
    error,
    notice,
    isBusy:
      fetchStatus === "fetching" ||
      emailForm.formState.isSubmitting ||
      codeForm.formState.isSubmitting ||
      passwordForm.formState.isSubmitting,
    onEmailSubmit,
    onCodeSubmit,
    onPasswordSubmit,
    onResendCode,
    onBack,
  };
};

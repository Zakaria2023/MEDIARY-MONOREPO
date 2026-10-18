import { useSignIn } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { authErrorMessage } from "auth/errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CodeInput, codeSchema, SignInInput, signInSchema } from "validators";

/** Where the flow is: the email and password, or a code from an email. */
type SignInStep = "credentials" | "code";

/** Why a code was sent: to sign in without a password, or to confirm a new device. */
type CodeReason = "sign_in" | "new_device";

/**
 * THE SIGN-IN FLOW ON A PHONE, the web's own steps (`packages/auth`): email
 * and password, or an emailed code instead, and a code to confirm a device
 * the identity service does not know yet. Every sentence comes from
 * `authErrorMessage`, so the phone and the site say the same thing. A
 * finished sign-in navigates nowhere itself: the session changes, and the
 * sign-in group's layout sends the person on.
 */
export const useSignInFlow = () => {
  const { signIn, fetchStatus } = useSignIn();
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

  /** After a first factor: done, or one more code for a device it does not know. */
  const continueAfterFirstFactor = async () => {
    if (signIn.status === "complete") {
      await signIn.finalize();
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
      setNotice("This phone is new to your account. We sent a code to your email to confirm it is you.");
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

  /** "Email me a code instead": only the email has to be valid. */
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
      codeReason === "sign_in" ? await signIn.emailCode.sendCode() : await signIn.mfa.sendEmailCode();
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
  };
};

import { useSignUp } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { authErrorMessage } from "auth/errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CodeInput, codeSchema, SignUpInput, signUpSchema } from "validators";

type SignUpStep = "details" | "verify";

/**
 * THE SIGN-UP FLOW ON A PHONE, as on the site: an email and a password,
 * then the six-digit code that proves the email is theirs. The handle and
 * the name come after, on Mediary's own welcome screen.
 */
export const useSignUpFlow = () => {
  const { signUp, fetchStatus } = useSignUp();
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
      await signUp.finalize();
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
  };
};

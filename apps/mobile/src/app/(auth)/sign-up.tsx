import { AuthFrame } from "@/components/auth/auth-frame";
import { CodeStep } from "@/components/auth/code-step";
import { SignUpDetails } from "@/components/auth/sign-up-details";
import { TextLink } from "@/components/auth/text-link";
import { Notice } from "@/components/ui/notice";
import { useSignUpFlow } from "@/hooks/auth/use-sign-up-flow";

const SignUpScreen = () => {
  const { step, details, codeForm, error, notice, isBusy, onDetailsSubmit, onCodeSubmit, onResendCode, onBack } =
    useSignUpFlow();
  return (
    <AuthFrame
      title={step === "verify" ? "Confirm your email" : "Create your account"}
      subtitle={
        step === "verify"
          ? "Enter the code we sent you."
          : "One profile for everything you watch, play, read and listen to."
      }
      footer={<TextLink lead="Already have an account?" label="Sign in" href="/sign-in" />}
    >
      {notice ? <Notice message={notice} /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {step === "details" ? (
        <SignUpDetails form={details} isBusy={isBusy} onSubmit={onDetailsSubmit} />
      ) : (
        <CodeStep form={codeForm} isBusy={isBusy} onSubmit={onCodeSubmit} onResend={onResendCode} onBack={onBack} />
      )}
    </AuthFrame>
  );
};

export default SignUpScreen;

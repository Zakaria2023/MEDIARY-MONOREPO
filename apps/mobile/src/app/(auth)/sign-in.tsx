import { AuthFrame } from "@/components/auth/auth-frame";
import { CodeStep } from "@/components/auth/code-step";
import { SignInCredentials } from "@/components/auth/sign-in-credentials";
import { TextLink } from "@/components/auth/text-link";
import { Notice } from "@/components/ui/notice";
import { useSignInFlow } from "@/hooks/auth/use-sign-in-flow";

const SignInScreen = () => {
  const {
    step,
    credentials,
    codeForm,
    error,
    notice,
    isBusy,
    onPasswordSubmit,
    onRequestCode,
    onCodeSubmit,
    onResendCode,
    onBack,
  } = useSignInFlow();
  return (
    <AuthFrame
      title={step === "code" ? "Check your email" : "Welcome back"}
      subtitle={step === "code" ? "Enter the code we sent you." : "Sign in to your library, diary and stats."}
      footer={<TextLink lead="New to Mediary?" label="Create an account" href="/sign-up" />}
    >
      {notice ? <Notice message={notice} /> : null}
      {error ? <Notice tone="error" message={error} /> : null}
      {step === "credentials" ? (
        <SignInCredentials form={credentials} isBusy={isBusy} onSubmit={onPasswordSubmit} onRequestCode={onRequestCode} />
      ) : (
        <CodeStep form={codeForm} isBusy={isBusy} onSubmit={onCodeSubmit} onResend={onResendCode} onBack={onBack} />
      )}
    </AuthFrame>
  );
};

export default SignInScreen;

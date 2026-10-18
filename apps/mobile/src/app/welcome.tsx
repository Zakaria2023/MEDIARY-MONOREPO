import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { CloudOff } from "lucide-react-native";
import { AuthFrame } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Notice } from "@/components/ui/notice";
import { StateMessage } from "@/components/ui/state-message";
import { useWelcomeForm } from "@/hooks/auth/use-welcome-form";

const WelcomeScreen = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { form, me, usernameStatus, error, isPending, onSubmit } = useWelcomeForm();
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }
  if (me.isPending) {
    return <LoadingScreen />;
  }
  if (me.isError) {
    return (
      <StateMessage
        icon={CloudOff}
        title="We could not load your account"
        body={me.error.message}
        actionLabel="Try again"
        onAction={() => void me.refetch()}
      />
    );
  }
  if (me.data.username) {
    return <Redirect href="/" />;
  }
  return (
    <AuthFrame title="Pick your username" subtitle="It is your address on Mediary: mediary.com/@you. You can change your name later.">
      {error ? <Notice tone="error" message={error} /> : null}
      <FormField
        control={form.control}
        name="username"
        label="Username"
        status={usernameStatus}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        returnKeyType="next"
      />
      <FormField control={form.control} name="displayName" label="Name" maxLength={80} returnKeyType="go" onSubmitEditing={onSubmit} />
      <Button label="Start tracking" variant="primary" block busy={isPending} onPress={onSubmit} />
    </AuthFrame>
  );
};

export default WelcomeScreen;

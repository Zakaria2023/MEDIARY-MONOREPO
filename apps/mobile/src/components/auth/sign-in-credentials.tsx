import { UseFormReturn } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { SignInInput } from "validators";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { space } from "@/lib/theme";
import { GoogleButton } from "./google-button";

type SignInCredentialsProps = {
  form: UseFormReturn<SignInInput>;
  isBusy: boolean;
  onSubmit: () => void;
  onRequestCode: () => void;
};

/** The email and password, or "email me a code instead", or Google. */
export const SignInCredentials = ({ form, isBusy, onSubmit, onRequestCode }: SignInCredentialsProps) => (
  <View style={styles.form}>
    <FormField
      control={form.control}
      name="email"
      label="Email"
      placeholder="you@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
      textContentType="emailAddress"
      returnKeyType="next"
    />
    <FormField
      control={form.control}
      name="password"
      label="Password"
      secureTextEntry
      autoCapitalize="none"
      autoComplete="current-password"
      textContentType="password"
      returnKeyType="go"
      onSubmitEditing={onSubmit}
    />
    <Button label="Sign in" variant="primary" block busy={isBusy} onPress={onSubmit} />
    <Button label="Email me a code instead" variant="ghost" block disabled={isBusy} onPress={onRequestCode} />
    <GoogleButton />
  </View>
);

const styles = StyleSheet.create({
  form: {
    gap: space[4],
  },
});

import { UseFormReturn } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { PASSWORD_MIN_LENGTH, SignUpInput } from "validators";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { space } from "@/lib/theme";
import { GoogleButton } from "./google-button";

type SignUpDetailsProps = {
  form: UseFormReturn<SignUpInput>;
  isBusy: boolean;
  onSubmit: () => void;
};

/** A new account's email and password, or Google. */
export const SignUpDetails = ({ form, isBusy, onSubmit }: SignUpDetailsProps) => (
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
      hint={`At least ${PASSWORD_MIN_LENGTH} characters. A short sentence works well.`}
      secureTextEntry
      autoCapitalize="none"
      autoComplete="new-password"
      textContentType="newPassword"
      returnKeyType="go"
      onSubmitEditing={onSubmit}
    />
    <Button label="Create account" variant="primary" block busy={isBusy} onPress={onSubmit} />
    <GoogleButton />
  </View>
);

const styles = StyleSheet.create({
  form: {
    gap: space[4],
  },
});

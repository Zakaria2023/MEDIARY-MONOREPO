import { UseFormReturn } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { CodeInput } from "validators";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { space } from "@/lib/theme";

type CodeStepProps = {
  form: UseFormReturn<CodeInput>;
  isBusy: boolean;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
};

/** The six-digit code from the email, with a way to send another and a way back. */
export const CodeStep = ({ form, isBusy, onSubmit, onResend, onBack }: CodeStepProps) => (
  <View style={styles.step}>
    <FormField
      control={form.control}
      name="code"
      label="Code"
      placeholder="123456"
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      maxLength={6}
      returnKeyType="done"
      onSubmitEditing={onSubmit}
    />
    <Button label="Continue" variant="primary" block busy={isBusy} onPress={onSubmit} />
    <View style={styles.row}>
      <Button label="Send a new code" variant="ghost" disabled={isBusy} onPress={onResend} />
      <Button label="Back" variant="ghost" disabled={isBusy} onPress={onBack} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  step: {
    gap: space[4],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

import { useState } from "react";
import { Control, FieldPath, FieldValues, useController } from "react-hook-form";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type FormFieldProps<Values extends FieldValues> = {
  control: Control<Values>;
  name: FieldPath<Values>;
  label: string;
  hint?: string;
  /** What the field says beside its own error, a live check's answer. */
  status?: string | null;
} & Pick<
  TextInputProps,
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "keyboardType"
  | "secureTextEntry"
  | "textContentType"
  | "placeholder"
  | "onSubmitEditing"
  | "returnKeyType"
  | "maxLength"
  | "multiline"
>;

/**
 * One labelled text field wired to its form: the value, the blur that
 * triggers validation, and the schema's sentence under it when it fails.
 */
export const FormField = <Values extends FieldValues>({
  control,
  name,
  label,
  hint,
  status,
  multiline,
  ...input
}: FormFieldProps<Values>) => {
  const { field, fieldState } = useController({ control, name });
  const [focused, setFocused] = useState(false);
  const message = fieldState.error?.message ?? status ?? hint;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={label}
        value={field.value == null ? "" : String(field.value)}
        onChangeText={field.onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          field.onBlur();
        }}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.accent}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          fieldState.error && styles.invalid,
        ]}
      />
      {message ? (
        <Text style={[styles.message, fieldState.error && styles.error]}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: space[2],
  },
  label: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
  input: {
    ...text.base,
    fontFamily: fonts.body,
    color: colors.ink,
    minHeight: 48,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  focused: {
    borderColor: colors.accent,
  },
  invalid: {
    borderColor: colors.danger,
  },
  message: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  error: {
    color: colors.danger,
  },
});

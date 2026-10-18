import { StyleSheet, Text } from "react-native";
import { colors, fonts, text } from "@/lib/theme";

type FieldLabelProps = {
  label: string;
};

/** The name over a group of controls that is not a text field. */
export const FieldLabel = ({ label }: FieldLabelProps) => <Text style={styles.label}>{label}</Text>;

const styles = StyleSheet.create({
  label: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
});

import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** A count after the label, as a filter tab shows how much is behind it. */
  count?: number;
};

/** A filter or a choice: flat, a hairline around it, the accent when chosen. */
export const Chip = ({ label, selected = false, onPress, count }: ChipProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
    onPress={onPress}
    style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
  >
    <Text style={[styles.label, selected && styles.selectedLabel]}>
      {label}
      {count === undefined ? "" : ` ${count}`}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: space[4],
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  selected: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accent,
  },
  pressed: {
    backgroundColor: colors.pressed,
  },
  label: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
  selectedLabel: {
    color: colors.ink,
  },
});

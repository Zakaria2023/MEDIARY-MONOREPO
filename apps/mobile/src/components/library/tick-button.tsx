import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { colors, radius } from "@/lib/theme";

type TickButtonProps = {
  titleName: string;
  disabled: boolean;
  onPress: () => void;
};

/** The "+1": one more episode, chapter, hour or play, in one tap. */
export const TickButton = ({ titleName, disabled, onPress }: TickButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Log one more for ${titleName}`}
    disabled={disabled}
    onPress={onPress}
    hitSlop={6}
    style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
  >
    <Plus size={18} color={colors.ink} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  pressed: {
    backgroundColor: colors.pressed,
  },
  disabled: {
    opacity: 0.6,
  },
});

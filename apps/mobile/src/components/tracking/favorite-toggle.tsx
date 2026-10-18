import { Heart } from "lucide-react-native";
import { Control, useController } from "react-hook-form";
import { Pressable, StyleSheet, Text } from "react-native";
import { UpsertEntryInput } from "validators";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type FavoriteToggleProps = {
  control: Control<UpsertEntryInput>;
};

/** The heart: a favorite goes on the profile's favorites. */
export const FavoriteToggle = ({ control }: FavoriteToggleProps) => {
  const { field } = useController({ control, name: "favorite" });
  const on = Boolean(field.value);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={() => field.onChange(!on)}
      style={[styles.toggle, on && styles.on]}
    >
      <Heart size={18} color={on ? colors.pink : colors.muted} fill={on ? colors.pink : "transparent"} />
      <Text style={styles.label}>{on ? "A favorite" : "Mark as a favorite"}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space[2],
    minHeight: 44,
    paddingHorizontal: space[4],
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  on: {
    borderColor: colors.pink,
  },
  label: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
});

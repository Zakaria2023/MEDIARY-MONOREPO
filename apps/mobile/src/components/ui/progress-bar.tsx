import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type ProgressBarProps = {
  /** How full, 0 to 1. */
  fraction: number;
  color?: string;
};

/** A thin bar of how far along something is, flat, in the status's color. */
export const ProgressBar = ({ fraction, color = colors.primary }: ProgressBarProps) => (
  <View
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
    style={styles.track}
  >
    <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: radius.chip,
    overflow: "hidden",
    backgroundColor: colors.hairlineStrong,
  },
  fill: {
    height: "100%",
    borderRadius: radius.chip,
  },
});

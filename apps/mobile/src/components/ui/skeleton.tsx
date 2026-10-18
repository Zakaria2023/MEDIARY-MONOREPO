import { Animated, DimensionValue, StyleSheet } from "react-native";
import { usePulse } from "@/lib/use-pulse";
import { colors, radius } from "@/lib/theme";

type SkeletonProps = {
  width: DimensionValue;
  height: number;
  /** A poster's corner, a control's, or a bar's. */
  shape?: "card" | "control" | "bar" | "circle";
};

/**
 * A loading box the SHAPE of what it stands in for: a poster's 2:3 box on a
 * grid, a bar for a line of text. One the wrong shape is a jump when the
 * content lands.
 */
export const Skeleton = ({ width, height, shape = "bar" }: SkeletonProps) => {
  const opacity = usePulse();
  const corner =
    shape === "card" ? radius.card : shape === "control" ? radius.control : shape === "circle" ? height / 2 : 4;
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width, height, borderRadius: corner, opacity }]}
    />
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface2,
  },
});

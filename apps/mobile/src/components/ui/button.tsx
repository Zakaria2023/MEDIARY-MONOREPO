import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { actionGradient, colors, fonts, radius, space, text } from "@/lib/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  busy?: boolean;
  /** Stretch to the row's width, as a form's submit does. */
  block?: boolean;
  accessibilityHint?: string;
  trailing?: ReactNode;
};

/**
 * THE APP'S BUTTON. `primary` is the logo's gradient with white text, the
 * same as the site's primary button and never a flat blue; the others are
 * flat with a hairline. Disabled dims the whole button, text included.
 */
export const Button = ({
  label,
  onPress,
  variant = "secondary",
  icon: Icon,
  disabled = false,
  busy = false,
  block = false,
  accessibilityHint,
  trailing,
}: ButtonProps) => {
  const inactive = disabled || busy;
  const tint = variant === "primary" ? colors.white : variant === "danger" ? colors.danger : colors.ink;
  const content = (
    <View style={styles.content}>
      {busy ? <ActivityIndicator size="small" color={tint} /> : Icon ? <Icon size={18} color={tint} /> : null}
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      {trailing}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        block && styles.block,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={actionGradient} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.fill}>{content}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  block: {
    alignSelf: "stretch",
  },
  fill: {
    minHeight: 48,
    paddingHorizontal: space[5],
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
  },
  label: {
    ...text.base,
    fontFamily: fonts.bodyMedium,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  danger: {
    backgroundColor: colors.dangerTint,
  },
  inactive: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});

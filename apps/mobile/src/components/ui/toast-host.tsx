import { CircleAlert, Info } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dismissToast, useToast } from "@/lib/toast-store";
import { colors, fonts, radius, space, text } from "@/lib/theme";

/** Where toasts appear: above the tab bar, one at a time, a tap to dismiss. */
export const ToastHost = () => {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  if (!toast) {
    return null;
  }
  const Icon = toast.tone === "error" ? CircleAlert : Info;
  return (
    <Pressable
      key={toast.id}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      onPress={dismissToast}
      style={[styles.toast, { bottom: insets.bottom + 72 }]}
    >
      <Icon size={18} color={toast.tone === "error" ? colors.danger : colors.accent} />
      <Text style={styles.message}>{toast.message}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: space[4],
    right: space[4],
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    padding: space[4],
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.overlay,
    // It floats over everything, so it is one of the few things with a shadow.
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  message: {
    ...text.sm,
    flex: 1,
    fontFamily: fonts.body,
    color: colors.ink,
  },
});

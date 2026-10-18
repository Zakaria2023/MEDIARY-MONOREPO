import { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, space, text } from "@/lib/theme";
import { Button } from "./button";

type StateMessageProps = {
  icon: LucideIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * AN EMPTY OR FAILED STATE, DESIGNED: an icon, a heading, a sentence and
 * the one thing to do next. No screen ever shows a bare "Error" or a blank.
 */
export const StateMessage = ({ icon: Icon, title, body, actionLabel, onAction }: StateMessageProps) => (
  <View style={styles.state}>
    <View style={styles.icon}>
      <Icon size={22} color={colors.muted} />
    </View>
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    {body ? <Text style={styles.body}>{body}</Text> : null}
    {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
  </View>
);

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[10],
    paddingHorizontal: space[6],
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  title: {
    ...text.lg,
    fontFamily: fonts.display,
    color: colors.ink,
    textAlign: "center",
  },
  body: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 320,
  },
});

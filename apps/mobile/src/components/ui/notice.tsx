import { CircleAlert, Info } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type NoticeProps = {
  message: string;
  tone?: "info" | "error";
};

/** A sentence above a form: what went wrong, or what just happened. */
export const Notice = ({ message, tone = "info" }: NoticeProps) => {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "text"}
      style={[styles.notice, tone === "error" ? styles.error : styles.info]}
    >
      <Icon size={18} color={tone === "error" ? colors.danger : colors.accent} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    gap: space[3],
    alignItems: "flex-start",
    padding: space[3],
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
  info: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentTint,
  },
  error: {
    backgroundColor: colors.dangerTint,
    borderColor: colors.dangerTint,
  },
  message: {
    ...text.sm,
    flex: 1,
    fontFamily: fonts.body,
    color: colors.ink,
  },
});

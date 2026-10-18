import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, space, text } from "@/lib/theme";

/** The top of a member's home: the wordmark. */
export const MemberHeader = () => (
  <View style={styles.header}>
    <Text accessibilityRole="header" style={styles.wordmark}>
      Mediary
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[4],
    paddingTop: space[3],
  },
  wordmark: {
    ...text.xl,
    fontFamily: fonts.display,
    color: colors.ink,
  },
});

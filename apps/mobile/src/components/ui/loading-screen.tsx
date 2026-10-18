import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

/** The page while the session or the account is still being read: the canvas and a quiet spinner. */
export const LoadingScreen = () => (
  <View style={styles.page} accessibilityLabel="Loading">
    <ActivityIndicator color={colors.muted} />
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.page,
  },
});

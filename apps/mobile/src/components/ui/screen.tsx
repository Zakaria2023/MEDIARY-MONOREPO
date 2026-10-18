import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";
import { colors, space } from "@/lib/theme";

type ScreenProps = {
  children: ReactNode;
  /** Scroll the content; off for a screen that holds its own list. */
  scroll?: boolean;
  /** Which edges keep clear of the notch and the home bar. A screen under a header skips the top. */
  edges?: Edge[];
  /** Pull to refresh, for a scrolling screen. */
  onRefresh?: () => void;
  refreshing?: boolean;
  padded?: boolean;
};

/** The page every screen sits on: the canvas color, clear of the device's edges. */
export const Screen = ({
  children,
  scroll = false,
  edges = ["top", "left", "right"],
  onRefresh,
  refreshing = false,
  padded = true,
}: ScreenProps) => (
  <SafeAreaView edges={edges} style={styles.page}>
    {scroll ? (
      <ScrollView
        contentContainerStyle={[styles.content, padded && styles.padded]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.fill, padded && styles.padded]}>{children}</View>
    )}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingBottom: space[12],
    gap: space[6],
  },
  padded: {
    paddingHorizontal: space[4],
  },
});

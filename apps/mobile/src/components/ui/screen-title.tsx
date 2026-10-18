import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, space, text } from "@/lib/theme";

type ScreenTitleProps = {
  title: string;
  /** A small line under it: a count, a date. */
  subtitle?: string;
  /** Something at the right: an icon button. */
  trailing?: ReactNode;
};

/** A tab's own heading, in place of a navigation bar. */
export const ScreenTitle = ({ title, subtitle, trailing }: ScreenTitleProps) => (
  <View style={styles.bar}>
    <View style={styles.names}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {trailing}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  names: {
    flex: 1,
    gap: space[1],
  },
  title: {
    ...text["2xl"],
    fontFamily: fonts.display,
    color: colors.ink,
  },
  subtitle: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});

import { Href, Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, space, text } from "@/lib/theme";

type SectionHeaderProps = {
  title: string;
  /** Where "See all" leads, when the section has more than it shows. */
  href?: Href;
};

/** A section's heading, with "See all" on the right when there is more. */
export const SectionHeader = ({ title, href }: SectionHeaderProps) => (
  <View style={styles.header}>
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    {href ? (
      <Link href={href} style={styles.link}>
        See all
      </Link>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space[3],
  },
  title: {
    ...text.lg,
    flexShrink: 1,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  link: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.accent,
  },
});

import { Href, Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { colors, fonts, text } from "@/lib/theme";

type TextLinkProps = {
  lead: string;
  label: string;
  href: Href;
};

/** "New to Mediary? Create an account": a sentence with its link at the end. */
export const TextLink = ({ lead, label, href }: TextLinkProps) => (
  <Text style={styles.lead}>
    {lead}{" "}
    <Link href={href} replace style={styles.link}>
      {label}
    </Link>
  </Text>
);

const styles = StyleSheet.create({
  lead: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    color: colors.accent,
  },
});

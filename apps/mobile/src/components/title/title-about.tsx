import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "@/components/ui/section-header";
import { colors, fonts, space, text } from "@/lib/theme";

type TitleAboutProps = {
  description: string | null;
};

/** How many lines the description shows before "More". */
const COLLAPSED_LINES = 5;

/** What the title is about, cut to a few lines with "More" when it runs long. */
export const TitleAbout = ({ description }: TitleAboutProps) => {
  const [expanded, setExpanded] = useState(false);
  if (!description) {
    return null;
  }
  return (
    <View style={styles.section}>
      <SectionHeader title="About" />
      <Text numberOfLines={expanded ? undefined : COLLAPSED_LINES} style={styles.body}>
        {description}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => setExpanded((open) => !open)} hitSlop={8}>
        <Text style={styles.more}>{expanded ? "Less" : "More"}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: space[2],
    paddingHorizontal: space[4],
  },
  body: {
    ...text.base,
    fontFamily: fonts.body,
    color: colors.secondary,
  },
  more: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.accent,
  },
});

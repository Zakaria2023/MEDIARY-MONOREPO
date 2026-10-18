import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { diaryDetail, diaryMoment } from "services/pure";
import { Poster } from "@/components/catalog/poster";
import { DiaryLine as DiaryLineData } from "@/lib/api-types";
import { colors, fonts, space, text } from "@/lib/theme";
import { titleHref } from "@/lib/title-href";

type DiaryLineProps = {
  line: DiaryLineData;
  zone: string;
  /** With the date, for a list that is not grouped by day. */
  showDate?: boolean;
};

/** One moment: the poster, the title, what happened in the site's words, and when. It opens the title. */
export const DiaryLine = ({ line, zone, showDate = false }: DiaryLineProps) => (
  <Link href={titleHref(line.title)} asChild>
    <Pressable accessibilityRole="link" style={styles.slot}>
      {({ pressed }) => (
        <View style={[styles.line, pressed && styles.pressed]}>
          <Poster src={line.title.coverUrl} alt={line.title.canonicalTitle} width={40} dominantColor={line.title.dominantColor} radius="control" />
          <View style={styles.body}>
            <Text numberOfLines={1} style={styles.name}>
              {line.title.canonicalTitle}
            </Text>
            <Text numberOfLines={2} style={styles.detail}>
              {diaryDetail(line)}
            </Text>
          </View>
          <Text style={styles.time}>{diaryMoment(new Date(line.eventAt), zone, showDate)}</Text>
        </View>
      )}
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  slot: {
    alignSelf: "stretch",
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[2],
  },
  pressed: {
    opacity: 0.8,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  detail: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  time: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.faint,
  },
});

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { notificationSentence } from "services/pure";
import { formatRelativeTime } from "utils";
import { Poster } from "@/components/catalog/poster";
import { Avatar } from "@/components/ui/avatar";
import { NotificationItem } from "@/lib/api-types";
import { personHref } from "@/lib/person-href";
import { colors, fonts, radius, space, text } from "@/lib/theme";
import { titleHref } from "@/lib/title-href";

type NotificationLineProps = {
  item: NotificationItem;
};

/** Who did what to which of yours, and when; a dot while it is new, the title's poster on the end. */
export const NotificationLine = ({ item }: NotificationLineProps) => (
  <View style={styles.line}>
    <Avatar name={item.actor.displayName} imageUrl={item.actor.imageUrl} size={36} />
    <View style={styles.body}>
      <Text style={styles.sentence}>
        {item.actor.username ? (
          <Link href={personHref(item.actor.username)} style={styles.strong}>
            {item.actor.displayName}
          </Link>
        ) : (
          <Text style={styles.strong}>{item.actor.displayName}</Text>
        )}{" "}
        {notificationSentence(item)}
        {item.title ? (
          <>
            {" on "}
            <Link href={titleHref(item.title)} style={styles.strong}>
              {item.title.canonicalTitle}
            </Link>
          </>
        ) : null}
      </Text>
      <Text style={styles.time}>{formatRelativeTime(new Date(item.createdAt))}</Text>
    </View>
    {item.readAt === null ? <View accessibilityLabel="New" style={styles.dot} /> : null}
    {item.title ? (
      <Poster src={item.title.coverUrl} alt={item.title.canonicalTitle} width={32} dominantColor={item.title.dominantColor} radius="control" />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  body: {
    flex: 1,
    gap: space[1],
  },
  sentence: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.secondary,
  },
  strong: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  time: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.faint,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.chip,
    backgroundColor: colors.accent,
  },
});

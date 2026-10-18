import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { feedVerb } from "services/pure";
import { formatRelativeTime } from "utils";
import { Poster } from "@/components/catalog/poster";
import { Avatar } from "@/components/ui/avatar";
import { FeedItem } from "@/lib/api-types";
import { personHref } from "@/lib/person-href";
import { colors, fonts, space, text } from "@/lib/theme";
import { titleHref } from "@/lib/title-href";

type FeedLineProps = {
  item: FeedItem;
};

/** One thing someone did: who, the verb in the site's words, what it was about with its poster, and when. */
export const FeedLine = ({ item }: FeedLineProps) => (
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
        {feedVerb(item)}{" "}
        {item.title ? (
          <Link href={titleHref(item.title)} style={styles.strong}>
            {item.title.canonicalTitle}
          </Link>
        ) : item.targetUser?.username ? (
          <Link href={personHref(item.targetUser.username)} style={styles.strong}>
            {item.targetUser.displayName}
          </Link>
        ) : item.list ? (
          <Text style={styles.strong}>{item.list.name}</Text>
        ) : null}
      </Text>
      {item.review?.headline ? (
        <Text numberOfLines={2} style={styles.quote}>
          “{item.review.headline}”
        </Text>
      ) : null}
      <Text style={styles.time}>{formatRelativeTime(new Date(item.createdAt))}</Text>
    </View>
    {item.title ? (
      <Poster src={item.title.coverUrl} alt={item.title.canonicalTitle} width={40} dominantColor={item.title.dominantColor} radius="control" />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  quote: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  time: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.faint,
  },
});

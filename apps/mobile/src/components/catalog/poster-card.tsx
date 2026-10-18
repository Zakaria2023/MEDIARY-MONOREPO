import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CatalogCard } from "@/lib/api-types";
import { colors, fonts, space, text } from "@/lib/theme";
import { cardMeta, titleHref } from "@/lib/title-href";
import { Poster } from "./poster";

type PosterCardProps = {
  card: CatalogCard;
  width: number;
};

/** A title on a grid or a rail: its poster, its name, its year and medium. The whole card opens it. */
export const PosterCard = ({ card, width }: PosterCardProps) => (
  <Link href={titleHref(card)} asChild>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${card.canonicalTitle}, ${cardMeta(card)}`}
      style={{ width }}
    >
      {({ pressed }) => (
        <View style={[styles.body, { width }, pressed && styles.pressed]}>
          <Poster
            src={card.coverUrl}
            alt={card.canonicalTitle}
            width={width}
            dominantColor={card.dominantColor}
            shape={card.mediaType === "music" ? "square" : "poster"}
          />
          <Text numberOfLines={2} style={styles.title}>
            {card.canonicalTitle}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {cardMeta(card)}
          </Text>
        </View>
      )}
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  body: {
    gap: space[1],
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    ...text.sm,
    marginTop: space[1],
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  meta: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});

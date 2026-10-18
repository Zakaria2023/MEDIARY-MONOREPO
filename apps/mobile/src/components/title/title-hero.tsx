import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Star } from "lucide-react-native";
import { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { catalogImageUrl } from "utils";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/db/label";
import { Poster } from "@/components/catalog/poster";
import { TitleDetail } from "@/lib/api-types";
import { backdropFade, colors, fonts, space, text } from "@/lib/theme";

type TitleHeroProps = {
  title: TitleDetail;
  /** The primary action under the name: add, or the member's status. */
  action?: ReactNode;
};

const POSTER_WIDTH = 116;

/**
 * The top of a title: its backdrop faded into the page so the name stays
 * legible, the poster, the name, what it is and when, and the one thing to
 * do with it.
 */
export const TitleHero = ({ title, action }: TitleHeroProps) => {
  const { width } = useWindowDimensions();
  const backdropHeight = Math.round((width * 9) / 16);
  const meta = [
    title.releaseYear ? String(title.releaseYear) : null,
    MEDIA_TYPE_LABELS[title.mediaType],
    MEDIA_STATUS_LABELS[title.status],
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <View>
      <View style={{ height: backdropHeight }}>
        {title.backdropUrl ? (
          <Image
            source={{ uri: catalogImageUrl(title.backdropUrl, width * 2) }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            accessibilityElementsHidden
          />
        ) : null}
        <LinearGradient colors={backdropFade} style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.body, { marginTop: -backdropHeight / 2 }]}>
        <Poster
          src={title.coverUrl}
          alt={title.canonicalTitle}
          width={POSTER_WIDTH}
          dominantColor={title.dominantColor}
          shape={title.mediaType === "music" ? "square" : "poster"}
        />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.name}>
            {title.canonicalTitle}
          </Text>
          <Text style={styles.meta}>{meta}</Text>
          {title.providerScore !== null ? (
            <View style={styles.score}>
              <Star size={14} color={colors.warning} fill={colors.warning} />
              <Text style={styles.scoreText}>{title.providerScore.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space[4],
    paddingHorizontal: space[4],
  },
  heading: {
    flex: 1,
    gap: space[1],
    paddingBottom: space[1],
  },
  name: {
    ...text["2xl"],
    fontFamily: fonts.display,
    color: colors.ink,
  },
  meta: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  score: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[1],
  },
  scoreText: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
  action: {
    paddingHorizontal: space[4],
    paddingTop: space[5],
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { Poster } from "@/components/catalog/poster";
import { RAIL_CARD_WIDTH } from "@/components/catalog/poster-rail";
import { TickButton } from "@/components/library/tick-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLibraryItem } from "@/hooks/library/use-library-item";
import { LibraryItem } from "@/lib/api-types";
import { colors, fonts, space, statusColors, text } from "@/lib/theme";

type ContinueCardProps = {
  item: LibraryItem;
};

/** Something in progress: its poster, how far along, and the "+1" right there. */
export const ContinueCard = ({ item }: ContinueCardProps) => {
  const { progressLabel, fraction, isTicking, onTick, openSheet } = useLibraryItem(item);
  const { title, entry } = item;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title.canonicalTitle}, ${progressLabel}`}
        accessibilityHint="Opens your entry"
        onPress={openSheet}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <Poster src={title.coverUrl} alt={title.canonicalTitle} width={RAIL_CARD_WIDTH} dominantColor={title.dominantColor} />
        <Text numberOfLines={1} style={styles.name}>
          {title.canonicalTitle}
        </Text>
        {fraction !== null ? <ProgressBar fraction={fraction} color={statusColors[entry.status]} /> : null}
      </Pressable>
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.progress}>
          {progressLabel}
        </Text>
        <TickButton titleName={title.canonicalTitle} disabled={isTicking} onPress={onTick} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: RAIL_CARD_WIDTH,
    gap: space[2],
  },
  body: {
    gap: space[2],
  },
  pressed: {
    opacity: 0.8,
  },
  name: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[2],
  },
  progress: {
    ...text.xs,
    flexShrink: 1,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
});

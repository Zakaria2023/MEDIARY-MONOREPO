import { Pressable, StyleSheet, Text, View } from "react-native";
import { Poster } from "@/components/catalog/poster";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLibraryItem } from "@/hooks/library/use-library-item";
import { LibraryItem } from "@/lib/api-types";
import { colors, fonts, space, statusColors, text } from "@/lib/theme";
import { TickButton } from "./tick-button";

type LibraryRowProps = {
  item: LibraryItem;
};

/** One title in the library: poster, name, status in the medium's words, progress, and the "+1". The row opens the sheet. */
export const LibraryRow = ({ item }: LibraryRowProps) => {
  const { statusLabel, mediumLabel, progressLabel, fraction, canTick, isTicking, onTick, openSheet } =
    useLibraryItem(item);
  const { title, entry } = item;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title.canonicalTitle}, ${statusLabel}, ${progressLabel}`}
        accessibilityHint="Opens your entry"
        onPress={openSheet}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Poster src={title.coverUrl} alt={title.canonicalTitle} width={52} dominantColor={title.dominantColor} radius="control" />
        <View style={styles.body}>
          <Text numberOfLines={2} style={styles.name}>
            {title.canonicalTitle}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            <Text style={{ color: statusColors[entry.status] }}>{statusLabel}</Text> · {mediumLabel}
            {entry.score !== null ? ` · ${entry.score}/10` : ""}
          </Text>
          <View style={styles.progress}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            {fraction !== null ? (
              <View style={styles.bar}>
                <ProgressBar fraction={fraction} color={statusColors[entry.status]} />
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
      {canTick ? <TickButton titleName={title.canonicalTitle} disabled={isTicking} onPress={onTick} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  pressed: {
    opacity: 0.8,
  },
  body: {
    flex: 1,
    gap: space[1],
  },
  name: {
    ...text.base,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  meta: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  progressLabel: {
    ...text.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
  bar: {
    flex: 1,
    maxWidth: 140,
  },
});

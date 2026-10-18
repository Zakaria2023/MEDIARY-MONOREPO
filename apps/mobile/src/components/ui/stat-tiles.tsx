import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type StatTilesProps = {
  tiles: { label: string; value: string }[];
};

/** Numbers in a row of flat tiles, a hairline around each: the value large, its name under it. */
export const StatTiles = ({ tiles }: StatTilesProps) => (
  <View style={styles.grid}>
    {tiles.map((tile) => (
      <View key={tile.label} accessible accessibilityLabel={`${tile.label}: ${tile.value}`} style={styles.tile}>
        <Text style={styles.value}>{tile.value}</Text>
        <Text style={styles.label}>{tile.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: space[1],
    padding: space[4],
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  value: {
    ...text.xl,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  label: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});

import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { POSTER_RATIO, space } from "@/lib/theme";
import { RAIL_CARD_WIDTH } from "./poster-rail";

/** A rail while it loads: a heading bar and a row of 2:3 boxes with their two lines. */
export const PosterRailSkeleton = () => (
  <View style={styles.rail}>
    <Skeleton width={160} height={20} />
    <View style={styles.row}>
      {[0, 1, 2, 3].map((slot) => (
        <View key={slot} style={styles.card}>
          <Skeleton width={RAIL_CARD_WIDTH} height={RAIL_CARD_WIDTH / POSTER_RATIO} shape="card" />
          <Skeleton width={RAIL_CARD_WIDTH * 0.8} height={12} />
          <Skeleton width={RAIL_CARD_WIDTH * 0.5} height={10} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  rail: {
    gap: space[3],
    paddingHorizontal: space[4],
  },
  row: {
    flexDirection: "row",
    gap: space[3],
    overflow: "hidden",
  },
  card: {
    gap: space[2],
  },
});

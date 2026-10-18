import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useGridWidth } from "@/lib/use-grid-width";
import { POSTER_RATIO, space } from "@/lib/theme";

/** A poster grid while it loads: four rows of 2:3 boxes, the shape of what is coming. */
export const PosterGridSkeleton = () => {
  const { columns, cardWidth, gap } = useGridWidth();
  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: columns * 4 }, (_, slot) => (
        <View key={slot} style={[styles.card, { width: cardWidth }]}>
          <Skeleton width={cardWidth} height={cardWidth / POSTER_RATIO} shape="card" />
          <Skeleton width={cardWidth * 0.8} height={12} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: space[4],
  },
  card: {
    gap: space[2],
    marginBottom: space[2],
  },
});

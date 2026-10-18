import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { colors, space } from "@/lib/theme";

/** The library while it loads: rows of a small poster and three lines. */
export const LibraryRowSkeleton = () => (
  <View>
    {[0, 1, 2, 3, 4, 5].map((slot) => (
      <View key={slot} style={styles.row}>
        <Skeleton width={52} height={78} shape="control" />
        <View style={styles.lines}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={10} />
          <Skeleton width="55%" height={10} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  lines: {
    flex: 1,
    gap: space[2],
  },
});

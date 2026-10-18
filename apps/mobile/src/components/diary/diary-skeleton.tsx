import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { space } from "@/lib/theme";

/** The diary while it loads: a day heading and its moments, each a small poster and two lines. */
export const DiarySkeleton = () => (
  <View style={styles.list}>
    <Skeleton width={180} height={16} />
    {[0, 1, 2, 3, 4].map((slot) => (
      <View key={slot} style={styles.line}>
        <Skeleton width={40} height={60} shape="control" />
        <View style={styles.lines}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: {
    gap: space[3],
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  lines: {
    flex: 1,
    gap: space[2],
  },
});

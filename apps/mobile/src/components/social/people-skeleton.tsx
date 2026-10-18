import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { space } from "@/lib/theme";

/** A list of people's lines while it loads: an avatar, a sentence, a time, a small poster. */
export const PeopleSkeleton = () => (
  <View style={styles.list}>
    {[0, 1, 2, 3, 4, 5].map((slot) => (
      <View key={slot} style={styles.line}>
        <Skeleton width={36} height={36} shape="circle" />
        <View style={styles.lines}>
          <Skeleton width="80%" height={12} />
          <Skeleton width="30%" height={10} />
        </View>
        <Skeleton width={36} height={54} shape="control" />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: {
    gap: space[4],
    paddingTop: space[2],
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

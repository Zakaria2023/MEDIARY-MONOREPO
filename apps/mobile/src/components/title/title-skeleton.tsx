import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { space } from "@/lib/theme";

/** A title while it loads: the backdrop, the poster beside its name, the button, the paragraph. */
export const TitleSkeleton = () => {
  const { width } = useWindowDimensions();
  const backdropHeight = Math.round((width * 9) / 16);
  return (
    <View style={styles.page}>
      <Skeleton width="100%" height={backdropHeight} shape="control" />
      <View style={[styles.row, { marginTop: -backdropHeight / 2 }]}>
        <Skeleton width={116} height={174} shape="card" />
        <View style={styles.heading}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
      <View style={styles.block}>
        <Skeleton width="100%" height={48} shape="control" />
        <Skeleton width="100%" height={14} />
        <Skeleton width="92%" height={14} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    gap: space[5],
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space[4],
    paddingHorizontal: space[4],
  },
  heading: {
    flex: 1,
    gap: space[2],
  },
  block: {
    gap: space[3],
    paddingHorizontal: space[4],
  },
});

import { FlatList, StyleSheet, View } from "react-native";
import { PosterRailSkeleton } from "@/components/catalog/poster-rail-skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { useContinue } from "@/hooks/home/use-continue";
import { space } from "@/lib/theme";
import { ContinueCard } from "./continue-card";

/** "Continue": what the member is in the middle of. Nothing at all when there is nothing in progress. */
export const ContinueRail = () => {
  const continuing = useContinue();
  if (continuing.isPending) {
    return <PosterRailSkeleton />;
  }
  if (!continuing.data || continuing.data.length === 0) {
    return null;
  }
  return (
    <View style={styles.rail}>
      <View style={styles.header}>
        <SectionHeader title="Continue" href="/library" />
      </View>
      <FlatList
        horizontal
        data={continuing.data}
        keyExtractor={(item) => item.entry.uuid}
        renderItem={({ item }) => <ContinueCard item={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rail: {
    gap: space[3],
  },
  header: {
    paddingHorizontal: space[4],
  },
  row: {
    gap: space[3],
    paddingHorizontal: space[4],
  },
});

import { ReactElement } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { CatalogCard } from "@/lib/api-types";
import { useGridWidth } from "@/lib/use-grid-width";
import { colors, space } from "@/lib/theme";
import { PosterCard } from "./poster-card";

type PosterGridProps = {
  cards: CatalogCard[];
  /** What scrolls away above the posters: a screen's filters. */
  header?: ReactElement;
  /** Shown in place of the posters when there are none. */
  empty?: ReactElement;
  hasMore: boolean;
  loadingMore: boolean;
  onEndReached: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Posters in columns, the next page asked for as the end comes near. */
export const PosterGrid = ({
  cards,
  header,
  empty,
  hasMore,
  loadingMore,
  onEndReached,
  refreshing = false,
  onRefresh,
}: PosterGridProps) => {
  const { columns, cardWidth, gap } = useGridWidth();
  return (
    <FlatList
      key={columns}
      data={cards}
      numColumns={columns}
      keyExtractor={(card) => card.uuid}
      renderItem={({ item }) => <PosterCard card={item} width={cardWidth} />}
      columnWrapperStyle={{ gap }}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.more} color={colors.muted} /> : <View style={styles.more} />}
      onEndReached={hasMore ? onEndReached : undefined}
      onEndReachedThreshold={0.6}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} /> : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  content: {
    gap: space[4],
    paddingHorizontal: space[4],
  },
  more: {
    paddingVertical: space[8],
  },
});

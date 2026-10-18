import { CloudOff, SearchX } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { PosterGrid } from "@/components/catalog/poster-grid";
import { PosterGridSkeleton } from "@/components/catalog/poster-grid-skeleton";
import { MediumFilter } from "@/components/explore/medium-filter";
import { MediumList } from "@/components/explore/medium-list";
import { SearchField } from "@/components/explore/search-field";
import { Screen } from "@/components/ui/screen";
import { StateMessage } from "@/components/ui/state-message";
import { useExploreScreen } from "@/hooks/catalog/use-explore-screen";
import { space } from "@/lib/theme";

const ExploreScreen = () => {
  const { query, settled, searching, results, cards, countsByType, mediaType, onQuery, onMediaType, onClear } =
    useExploreScreen();
  return (
    <Screen padded={false}>
      <View style={styles.top}>
        <SearchField value={query} onChange={onQuery} onClear={onClear} />
      </View>
      {!searching ? (
        <ScrollView contentContainerStyle={styles.browse}>
          <MediumList />
        </ScrollView>
      ) : results.isPending ? (
        <PosterGridSkeleton />
      ) : results.isError ? (
        <StateMessage
          icon={CloudOff}
          title="The search did not go through"
          body={results.error.message}
          actionLabel="Try again"
          onAction={() => void results.refetch()}
        />
      ) : (
        <PosterGrid
          cards={cards}
          header={
            cards.length > 0 || mediaType ? (
              <MediumFilter selected={mediaType} counts={countsByType} onSelect={onMediaType} />
            ) : undefined
          }
          empty={
            <StateMessage
              icon={SearchX}
              title={`Nothing called "${settled}"`}
              body="Try another spelling, or the name it has in another language."
            />
          }
          hasMore={results.hasNextPage}
          loadingMore={results.isFetchingNextPage}
          onEndReached={() => void results.fetchNextPage()}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: space[4],
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  browse: {
    paddingHorizontal: space[4],
    paddingBottom: space[12],
  },
});

export default ExploreScreen;

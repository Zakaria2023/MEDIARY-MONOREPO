import { router } from "expo-router";
import { CloudOff, Filter, LibraryBig, LogIn } from "lucide-react-native";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryRow } from "@/components/library/library-row";
import { LibraryRowSkeleton } from "@/components/library/library-row-skeleton";
import { Screen } from "@/components/ui/screen";
import { ScreenTitle } from "@/components/ui/screen-title";
import { StateMessage } from "@/components/ui/state-message";
import { useLibraryScreen } from "@/hooks/library/use-library-screen";
import { colors, space } from "@/lib/theme";

const LibraryScreen = () => {
  const {
    isSignedIn,
    pages,
    items,
    countLabel,
    isFiltered,
    mediaType,
    status,
    mediaOptions,
    statusOptions,
    onMediaType,
    onStatus,
    onRefresh,
  } = useLibraryScreen();
  if (!isSignedIn) {
    return (
      <Screen>
        <StateMessage
          icon={LogIn}
          title="Your library lives here"
          body="Sign in to keep everything you watch, play, read and listen to in one place."
          actionLabel="Sign in"
          onAction={() => router.push("/sign-in")}
        />
      </Screen>
    );
  }
  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.entry.uuid}
        renderItem={({ item }) => <LibraryRow item={item} />}
        ListHeaderComponent={
          <View>
            <ScreenTitle title="Library" subtitle={countLabel} />
            <LibraryFilters
              mediaOptions={mediaOptions}
              statusOptions={statusOptions}
              mediaType={mediaType}
              status={status}
              onMediaType={onMediaType}
              onStatus={onStatus}
            />
          </View>
        }
        ListEmptyComponent={
          pages.isPending ? (
            <LibraryRowSkeleton />
          ) : pages.isError ? (
            <StateMessage
              icon={CloudOff}
              title="Your library did not load"
              body={pages.error.message}
              actionLabel="Try again"
              onAction={() => void pages.refetch()}
            />
          ) : isFiltered ? (
            <StateMessage icon={Filter} title="Nothing here" body="No titles match these filters. Press a chip again to clear it." />
          ) : (
            <StateMessage
              icon={LibraryBig}
              title="Your library is empty"
              body="Find something you are watching, playing, reading or listening to, and add it."
              actionLabel="Explore the catalog"
              onAction={() => router.push("/explore")}
            />
          )
        }
        ListFooterComponent={
          pages.isFetchingNextPage ? <ActivityIndicator style={styles.more} color={colors.muted} /> : <View style={styles.more} />
        }
        onEndReached={pages.hasNextPage ? () => void pages.fetchNextPage() : undefined}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl refreshing={pages.isRefetching && !pages.isFetchingNextPage} onRefresh={onRefresh} tintColor={colors.muted} />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  more: {
    paddingVertical: space[8],
  },
});

export default LibraryScreen;

import { router } from "expo-router";
import { CloudOff, LogIn, Users } from "lucide-react-native";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { FeedLine } from "@/components/social/feed-line";
import { PeopleSkeleton } from "@/components/social/people-skeleton";
import { Screen } from "@/components/ui/screen";
import { ScreenTitle } from "@/components/ui/screen-title";
import { StateMessage } from "@/components/ui/state-message";
import { useFeedScreen } from "@/hooks/social/use-feed-screen";
import { colors, space } from "@/lib/theme";

/** What the people the member follows are watching, playing, reading and listening to. */
const FeedScreen = () => {
  const { isSignedIn, pages, items } = useFeedScreen();
  if (!isSignedIn) {
    return (
      <Screen>
        <StateMessage
          icon={LogIn}
          title="See what friends are into"
          body="Sign in to follow people and see what they start, finish and score."
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
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => <FeedLine item={item} />}
        ListHeaderComponent={<ScreenTitle title="Feed" />}
        ListEmptyComponent={
          pages.isPending ? (
            <PeopleSkeleton />
          ) : pages.isError ? (
            <StateMessage
              icon={CloudOff}
              title="Your feed did not load"
              body={pages.error.message}
              actionLabel="Try again"
              onAction={() => void pages.refetch()}
            />
          ) : (
            <StateMessage
              icon={Users}
              title="Quiet in here"
              body="Follow people from their profiles and what they track shows up here, beside your own."
            />
          )
        }
        ListFooterComponent={
          pages.isFetchingNextPage ? <ActivityIndicator style={styles.more} color={colors.muted} /> : <View style={styles.more} />
        }
        onEndReached={pages.hasNextPage ? () => void pages.fetchNextPage() : undefined}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={pages.isRefetching && !pages.isFetchingNextPage}
            onRefresh={() => void pages.refetch()}
            tintColor={colors.muted}
          />
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

export default FeedScreen;

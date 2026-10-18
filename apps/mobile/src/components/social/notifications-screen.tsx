import { Bell, CloudOff } from "lucide-react-native";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { NotificationLine } from "@/components/social/notification-line";
import { PeopleSkeleton } from "@/components/social/people-skeleton";
import { Screen } from "@/components/ui/screen";
import { StateMessage } from "@/components/ui/state-message";
import { useNotificationsScreen } from "@/hooks/social/use-notifications-screen";
import { colors, space } from "@/lib/theme";

/** Follows, likes and replies on the member's things. Opening it marks them read. */
export const NotificationsScreen = () => {
  const { pages, items } = useNotificationsScreen();
  return (
    <Screen edges={["left", "right"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => <NotificationLine item={item} />}
        ListEmptyComponent={
          pages.isPending ? (
            <PeopleSkeleton />
          ) : pages.isError ? (
            <StateMessage
              icon={CloudOff}
              title="Your notifications did not load"
              body={pages.error.message}
              actionLabel="Try again"
              onAction={() => void pages.refetch()}
            />
          ) : (
            <StateMessage
              icon={Bell}
              title="Nothing new"
              body="When someone follows you, or likes or replies to something of yours, it shows up here."
            />
          )
        }
        ListFooterComponent={
          pages.isFetchingNextPage ? <ActivityIndicator style={styles.more} color={colors.muted} /> : <View style={styles.more} />
        }
        onEndReached={pages.hasNextPage ? () => void pages.fetchNextPage() : undefined}
        onEndReachedThreshold={0.6}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  more: {
    paddingVertical: space[8],
  },
});

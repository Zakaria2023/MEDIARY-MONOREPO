import { router } from "expo-router";
import { CloudOff, NotebookPen } from "lucide-react-native";
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from "react-native";
import { DiaryLine } from "@/components/diary/diary-line";
import { DiarySkeleton } from "@/components/diary/diary-skeleton";
import { Screen } from "@/components/ui/screen";
import { StateMessage } from "@/components/ui/state-message";
import { useDiaryScreen } from "@/hooks/diary/use-diary-screen";
import { colors, fonts, space, text } from "@/lib/theme";

/** Every moment the member logged, under the day it happened. */
export const DiaryScreen = () => {
  const { pages, zone, days } = useDiaryScreen();
  return (
    <Screen edges={["left", "right"]}>
      <SectionList
        sections={days}
        keyExtractor={(line) => line.uuid}
        renderItem={({ item }) => <DiaryLine line={item} zone={zone} />}
        renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          pages.isPending ? (
            <DiarySkeleton />
          ) : pages.isError ? (
            <StateMessage
              icon={CloudOff}
              title="Your diary did not load"
              body={pages.error.message}
              actionLabel="Try again"
              onAction={() => void pages.refetch()}
            />
          ) : (
            <StateMessage
              icon={NotebookPen}
              title="Nothing logged yet"
              body="Every status, step of progress and score you save lands here, on the day it happened."
              actionLabel="Find something to track"
              onAction={() => router.push("/explore")}
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
  content: {
    paddingTop: space[2],
  },
  day: {
    ...text.sm,
    paddingTop: space[5],
    paddingBottom: space[2],
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
    backgroundColor: colors.page,
  },
  more: {
    paddingVertical: space[8],
  },
});

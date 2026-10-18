import { Stack, useLocalSearchParams } from "expo-router";
import { CloudOff, Lock, UserX } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { PosterRail } from "@/components/catalog/poster-rail";
import { DiaryLine } from "@/components/diary/diary-line";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTiles } from "@/components/ui/stat-tiles";
import { StateMessage } from "@/components/ui/state-message";
import { useProfileScreen } from "@/hooks/social/use-profile-screen";
import { colors, fonts, space, text } from "@/lib/theme";

type PeopleParams = {
  username: string;
};

/** Someone's profile, the app's `/@username`: what their settings let this viewer see. */
const PersonScreen = () => {
  const { username } = useLocalSearchParams<PeopleParams>();
  const { profile, notFound, zone, numbers, favorites, activity, canFollow, isFollowing, onFollow } =
    useProfileScreen(username);
  if (profile.isPending) {
    return <LoadingScreen />;
  }
  if (profile.isError) {
    return (
      <Screen edges={["left", "right"]}>
        {notFound ? (
          <StateMessage icon={UserX} title="There is no one here" body="The name may be spelled differently, or the account is gone." />
        ) : (
          <StateMessage
            icon={CloudOff}
            title="This profile did not load"
            body={profile.error.message}
            actionLabel="Try again"
            onAction={() => void profile.refetch()}
          />
        )}
      </Screen>
    );
  }
  const person = profile.data;
  return (
    <Screen scroll edges={["left", "right"]}>
      <Stack.Screen options={{ title: `@${person.username}` }} />
      <ProfileHeader
        displayName={person.displayName}
        username={person.username}
        imageUrl={person.imageUrl}
        bio={person.bio}
        action={
          canFollow ? (
            <Button label={isFollowing ? "Following" : "Follow"} variant={isFollowing ? "secondary" : "primary"} onPress={onFollow} />
          ) : null
        }
      />
      {!person.access.profile ? (
        <StateMessage icon={Lock} title="This profile is private" body="Only what they choose to share shows here." />
      ) : (
        <>
          <StatTiles tiles={numbers} />
          {favorites.length > 0 ? (
            <View style={styles.bleed}>
              <PosterRail title="Favorites" cards={favorites} />
            </View>
          ) : null}
          {person.access.activity && activity.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Lately" />
              {activity.map((line) => (
                <DiaryLine key={line.uuid} line={line} zone={zone} showDate />
              ))}
            </View>
          ) : null}
          {!person.access.library ? <Text style={styles.note}>Their library is not shared with you.</Text> : null}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -space[4],
  },
  section: {
    gap: space[2],
  },
  note: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});

export default PersonScreen;

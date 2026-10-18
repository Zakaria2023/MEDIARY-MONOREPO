import { router } from "expo-router";
import { Bell, ChartColumn, LogIn, LogOut, NotebookPen, UserRound } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTiles } from "@/components/ui/stat-tiles";
import { StateMessage } from "@/components/ui/state-message";
import { MenuRow } from "@/components/you/menu-row";
import { useYouScreen } from "@/hooks/you/use-you-screen";
import { personHref } from "@/lib/person-href";
import { space } from "@/lib/theme";

/** The member's own corner: who they are, their numbers and week, and the way to everything that is theirs. */
const YouScreen = () => {
  const { isSignedIn, me, numbers, week, unread, onSignOut } = useYouScreen();
  if (!isSignedIn || !me?.username) {
    return (
      <Screen>
        <StateMessage
          icon={LogIn}
          title="Your corner of Mediary"
          body="Sign in for your diary, your stats and what people do with your reviews."
          actionLabel="Sign in"
          onAction={() => router.push("/sign-in")}
        />
      </Screen>
    );
  }
  return (
    <Screen scroll>
      <ProfileHeader displayName={me.displayName} username={me.username} imageUrl={me.imageUrl} />
      {numbers.length > 0 ? <StatTiles tiles={numbers} /> : null}
      {week.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="This week" />
          <StatTiles tiles={week} />
        </View>
      ) : null}
      <View>
        <MenuRow label="Notifications" icon={Bell} href="/notifications" badge={unread} />
        <MenuRow label="Diary" icon={NotebookPen} href="/diary" />
        <MenuRow label="Stats" icon={ChartColumn} href="/stats" />
        <MenuRow label="Your profile" icon={UserRound} href={personHref(me.username)} />
      </View>
      <Button label="Sign out" icon={LogOut} onPress={onSignOut} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: space[3],
  },
});

export default YouScreen;

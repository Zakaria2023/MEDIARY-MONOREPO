import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { LogIn, LogOut } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { StateMessage } from "@/components/ui/state-message";
import { colors, fonts, space, text } from "@/lib/theme";
import { useMe } from "@/lib/use-me";

/** The member's own corner: who they are signed in as, and the way out. */
const YouScreen = () => {
  const { isSignedIn, signOut } = useAuth();
  const me = useMe();
  if (!isSignedIn || !me.data) {
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
    <Screen scroll>
      <View style={styles.account}>
        <Avatar name={me.data.displayName} imageUrl={me.data.imageUrl} size={64} />
        <View style={styles.names}>
          <Text accessibilityRole="header" style={styles.name}>
            {me.data.displayName}
          </Text>
          <Text style={styles.handle}>@{me.data.username}</Text>
        </View>
      </View>
      <Button label="Sign out" icon={LogOut} onPress={() => void signOut()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
    paddingTop: space[6],
  },
  names: {
    flex: 1,
    gap: space[1],
  },
  name: {
    ...text.xl,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  handle: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});

export default YouScreen;

import { useAuth } from "@clerk/expo";
import { Redirect, router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Screen } from "@/components/ui/screen";
import { colors, fonts, text } from "@/lib/theme";
import { useMe } from "@/lib/use-me";

const Home = () => {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const me = useMe();
  if (!isLoaded || (isSignedIn && me.isPending)) {
    return <LoadingScreen />;
  }
  if (isSignedIn && me.data && !me.data.username) {
    return <Redirect href="/welcome" />;
  }
  return (
    <Screen>
      <Text style={styles.title}>Mediary</Text>
      <Text style={styles.body}>{me.data?.username ? `Signed in as @${me.data.username}` : "Not signed in"}</Text>
      {isSignedIn ? (
        <Button label="Sign out" onPress={() => void signOut()} />
      ) : (
        <Button label="Sign in" variant="primary" onPress={() => router.push("/sign-in")} />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { ...text["3xl"], fontFamily: fonts.display, color: colors.ink },
  body: { ...text.sm, fontFamily: fonts.body, color: colors.muted },
});

export default Home;

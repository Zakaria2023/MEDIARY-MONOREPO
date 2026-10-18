import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { colors, fonts, space, text } from "@/lib/theme";

/** The signed-out home's opening: what Mediary is, and the two ways in. */
export const HomeHero = () => (
  <View style={styles.hero}>
    <Text style={styles.wordmark}>Mediary</Text>
    <Text accessibilityRole="header" style={styles.headline}>
      Everything you watch, play, read and listen to. One profile.
    </Text>
    <Text style={styles.body}>
      Track anime, games, films, shows, music, manga, comics and books in one library, with a diary that remembers when.
    </Text>
    <View style={styles.actions}>
      <Button label="Create an account" variant="primary" onPress={() => router.push("/sign-up")} />
      <Button label="Sign in" onPress={() => router.push("/sign-in")} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  hero: {
    gap: space[4],
    paddingHorizontal: space[4],
    paddingTop: space[6],
  },
  wordmark: {
    ...text.lg,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  headline: {
    ...text["3xl"],
    fontFamily: fonts.display,
    color: colors.ink,
  },
  body: {
    ...text.base,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
});

import { Stack } from "expo-router";
import { useSessionBridge } from "@/lib/use-session-bridge";
import { colors, fonts } from "@/lib/theme";

/**
 * The app's one navigator. The tabs and the sign-in screens bring their own
 * chrome; a pushed screen gets the dark header with the back arrow alone.
 */
export const AppStack = () => {
  useSessionBridge();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.page },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.display, color: colors.ink },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.page },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="browse/[type]" options={{ title: "Browse" }} />
      <Stack.Screen name="diary" options={{ title: "Diary" }} />
      <Stack.Screen name="stats" options={{ title: "Stats" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="people/[username]" options={{ title: "" }} />
      <Stack.Screen
        name="entry/[mediaUuid]"
        options={{
          presentation: "modal",
          title: "Your entry",
          headerStyle: { backgroundColor: colors.surface },
          contentStyle: { backgroundColor: colors.surface },
        }}
      />
      <Stack.Screen
        name="title/[type]/[slug]"
        options={{ title: "", headerTransparent: true, headerStyle: { backgroundColor: "transparent" } }}
      />
    </Stack>
  );
};

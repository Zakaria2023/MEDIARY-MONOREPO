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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  );
};

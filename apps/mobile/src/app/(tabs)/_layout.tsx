import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { Compass, House, UserRound } from "lucide-react-native";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { colors, fonts } from "@/lib/theme";
import { useMe } from "@/lib/use-me";

/**
 * THE APP'S TABS. Open to everyone: the catalog never asks a visitor to
 * sign in, each private tab says what it needs instead. A signed-in account
 * without a username is sent to the welcome screen before anything else.
 */
const TabsLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const me = useMe();
  if (!isLoaded || (isSignedIn && me.isPending)) {
    return <LoadingScreen />;
  }
  if (isSignedIn && me.data && !me.data.username) {
    return <Redirect href="/welcome" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.page, borderTopColor: colors.hairline },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 14 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: "You", tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
      />
    </Tabs>
  );
};

export default TabsLayout;

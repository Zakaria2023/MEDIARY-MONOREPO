import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { colors } from "@/lib/theme";

/**
 * Sign-in and sign-up are for people without a session. A signed-in person
 * who lands here (or finishes signing in) is sent home, declaratively, so
 * the identity service never sees a second sign-in over a live session.
 */
const AuthLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return null;
  }
  if (isSignedIn) {
    return <Redirect href="/" />;
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }} />;
};

export default AuthLayout;

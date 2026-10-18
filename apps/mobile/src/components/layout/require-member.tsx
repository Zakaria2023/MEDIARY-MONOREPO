import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ReactNode } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useMe } from "@/lib/use-me";

type RequireMemberProps = {
  children: ReactNode;
};

/**
 * A private screen's gate, for one reached by a link while signed out:
 * sign in first, then pick a username, then the screen. Nothing private is
 * asked for before both are true.
 */
export const RequireMember = ({ children }: RequireMemberProps) => {
  const { isLoaded, isSignedIn } = useAuth();
  const me = useMe();
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }
  if (me.isPending) {
    return <LoadingScreen />;
  }
  if (me.data && !me.data.username) {
    return <Redirect href="/welcome" />;
  }
  return children;
};

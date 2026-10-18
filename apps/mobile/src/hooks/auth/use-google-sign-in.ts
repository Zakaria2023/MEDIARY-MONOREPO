import { useSSO } from "@clerk/expo";
import { authErrorMessage } from "auth/errors";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";

/**
 * "Continue with Google": the person's own account choice, opened in the
 * system browser and handed back to the app by its scheme. A sign-in from
 * an address with no account makes one, as on the site, and the welcome
 * screen then asks for a handle. Cancelling is not an error.
 */
export const useGoogleSignIn = () => {
  const { startSSOFlow } = useSSO();
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const onGoogle = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "mediary", path: "sso-callback" }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (ssoError) {
      setError(authErrorMessage(ssoError, "Google sign-in did not start. Try again."));
    } finally {
      setIsBusy(false);
    }
  };

  return { error, isBusy, onGoogle };
};

// Finishes a browser sign-in that lands back in the app on the web build;
// on a phone it does nothing.
WebBrowser.maybeCompleteAuthSession();

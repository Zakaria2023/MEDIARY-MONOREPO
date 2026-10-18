import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStack } from "@/components/layout/app-stack";
import { MissingConfig } from "@/components/layout/missing-config";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ToastHost } from "@/components/ui/toast-host";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { useAppFonts } from "@/lib/use-app-fonts";

/**
 * The identity service, headless (the app draws every screen itself), with
 * the session kept in the device's secure store; the API cache; the safe
 * area. Nothing private renders here: each group's layout decides who may
 * enter it.
 */
const RootLayout = () => {
  const fontsReady = useAppFonts();
  if (!CLERK_PUBLISHABLE_KEY) {
    return <MissingConfig />;
  }
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          {fontsReady ? <AppStack /> : <LoadingScreen />}
          <ToastHost />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default RootLayout;

import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Sora_400Regular } from "@expo-google-fonts/sora/400Regular";
import { Sora_600SemiBold } from "@expo-google-fonts/sora/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Sora_400Regular, Sora_600SemiBold });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }} />
    </>
  );
};

export default RootLayout;

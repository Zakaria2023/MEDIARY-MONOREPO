import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Sora_400Regular } from "@expo-google-fonts/sora/400Regular";
import { Sora_600SemiBold } from "@expo-google-fonts/sora/600SemiBold";
import { useFonts } from "expo-font";

/**
 * The site's two families at the weights it uses, imported by weight: the
 * packages' barrel pulls every weight into the bundle. A font that fails
 * to load leaves the system face, never a blank screen.
 */
export const useAppFonts = (): boolean => {
  const [loaded, error] = useFonts({ Manrope_400Regular, Manrope_500Medium, Sora_400Regular, Sora_600SemiBold });
  return loaded || error !== null;
};

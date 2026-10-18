import { Stack, useLocalSearchParams } from "expo-router";
import { MapPinOff } from "lucide-react-native";
import { parseLaunchMediaType } from "validators";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { BrowseGrid } from "@/components/catalog/browse-grid";
import { Screen } from "@/components/ui/screen";
import { StateMessage } from "@/components/ui/state-message";

type BrowseParams = {
  type: string;
  genre?: string;
};

/** A medium's grid, the app's version of the site's hub: `/browse/movie`, `?genre=` to start on one. */
const BrowseScreen = () => {
  const { type, genre } = useLocalSearchParams<BrowseParams>();
  const mediaType = parseLaunchMediaType(type);
  return (
    <Screen edges={["left", "right"]} padded={false}>
      <Stack.Screen options={{ title: mediaType ? MEDIA_TYPE_PLURAL_LABELS[mediaType] : "Browse" }} />
      {mediaType ? (
        <BrowseGrid mediaType={mediaType} initialGenre={genre} />
      ) : (
        <StateMessage icon={MapPinOff} title="There is nothing to browse here" body="That medium is not one Mediary tracks." />
      )}
    </Screen>
  );
};

export default BrowseScreen;

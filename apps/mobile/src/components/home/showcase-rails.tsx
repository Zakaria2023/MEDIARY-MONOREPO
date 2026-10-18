import { CloudOff } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { PosterRail } from "@/components/catalog/poster-rail";
import { PosterRailSkeleton } from "@/components/catalog/poster-rail-skeleton";
import { StateMessage } from "@/components/ui/state-message";
import { useShowcase } from "@/hooks/catalog/use-showcase";
import { space } from "@/lib/theme";

/** What is trending in every medium, a rail each, each leading to its medium's grid. */
export const ShowcaseRails = () => {
  const { showcase, rails } = useShowcase();
  if (showcase.isPending) {
    return (
      <View style={styles.rails}>
        <PosterRailSkeleton />
        <PosterRailSkeleton />
      </View>
    );
  }
  if (showcase.isError) {
    return (
      <StateMessage
        icon={CloudOff}
        title="The catalog did not load"
        body={showcase.error.message}
        actionLabel="Try again"
        onAction={() => void showcase.refetch()}
      />
    );
  }
  return (
    <View style={styles.rails}>
      {rails.map((rail) => (
        <PosterRail
          key={rail.mediaType}
          title={`Trending ${MEDIA_TYPE_PLURAL_LABELS[rail.mediaType].toLowerCase()}`}
          cards={rail.cards}
          href={{ pathname: "/browse/[type]", params: { type: rail.mediaType } }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rails: {
    gap: space[8],
  },
});

import { useLocalSearchParams } from "expo-router";
import { CloudOff, SearchX } from "lucide-react-native";
import { ScrollView, StyleSheet } from "react-native";
import { PosterRail } from "@/components/catalog/poster-rail";
import { GenreChips } from "@/components/title/genre-chips";
import { TitleAbout } from "@/components/title/title-about";
import { TitleCommunity } from "@/components/title/title-community";
import { TitleFacts } from "@/components/title/title-facts";
import { TitleHero } from "@/components/title/title-hero";
import { TitleSkeleton } from "@/components/title/title-skeleton";
import { TrackButton } from "@/components/tracking/track-button";
import { StateMessage } from "@/components/ui/state-message";
import { useTitleScreen } from "@/hooks/catalog/use-title-screen";
import { colors, space } from "@/lib/theme";

type TitleParams = {
  type: string;
  slug: string;
};

/** A title's own screen, at the same address as its page on the site. */
const TitleScreen = () => {
  const { type, slug } = useLocalSearchParams<TitleParams>();
  const { title, notFound, related, community } = useTitleScreen(type, slug);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {title.isPending ? (
        <TitleSkeleton />
      ) : title.isError ? (
        notFound ? (
          <StateMessage icon={SearchX} title="This title is not here" body="It may have moved, or the link is wrong." />
        ) : (
          <StateMessage
            icon={CloudOff}
            title="This title did not load"
            body={title.error.message}
            actionLabel="Try again"
            onAction={() => void title.refetch()}
          />
        )
      ) : (
        <>
          <TitleHero title={title.data} action={<TrackButton mediaUuid={title.data.uuid} />} />
          <GenreChips mediaType={title.data.mediaType} genres={title.data.genres} />
          <TitleAbout description={title.data.description} />
          <TitleCommunity mediaType={title.data.mediaType} community={community.data} />
          <TitleFacts facts={title.data.facts} />
          <PosterRail title="More like this" cards={related.data ?? []} />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    gap: space[6],
    paddingBottom: space[12],
  },
});

export default TitleScreen;

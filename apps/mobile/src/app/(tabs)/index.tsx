import { useAuth } from "@clerk/expo";
import { HomeHero } from "@/components/home/home-hero";
import { ShowcaseRails } from "@/components/home/showcase-rails";
import { Screen } from "@/components/ui/screen";

/** Home: for a visitor, what Mediary is and what is trending; for a member, the same catalog to add from. */
const HomeScreen = () => {
  const { isSignedIn } = useAuth();
  return (
    <Screen scroll padded={false}>
      {isSignedIn ? null : <HomeHero />}
      <ShowcaseRails />
    </Screen>
  );
};

export default HomeScreen;

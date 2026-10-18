import { useAuth } from "@clerk/expo";
import { ContinueRail } from "@/components/home/continue-rail";
import { HomeHero } from "@/components/home/home-hero";
import { MemberHeader } from "@/components/home/member-header";
import { ShowcaseRails } from "@/components/home/showcase-rails";
import { Screen } from "@/components/ui/screen";

/** Home: for a visitor, what Mediary is and what is trending; for a member, what they are in the middle of, then the catalog. */
const HomeScreen = () => {
  const { isSignedIn } = useAuth();
  return (
    <Screen scroll padded={false}>
      {isSignedIn ? (
        <>
          <MemberHeader />
          <ContinueRail />
        </>
      ) : (
        <HomeHero />
      )}
      <ShowcaseRails />
    </Screen>
  );
};

export default HomeScreen;

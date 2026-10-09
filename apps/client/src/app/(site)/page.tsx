import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/landing";
import { MemberHome } from "@/components/home/member-home";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth";
import { LANDING_FAQ } from "@/lib/landing-faq";
import { pageMetadata } from "@/lib/seo";
import { faqNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Track anime, games, movies, TV, music, manga, comics and books",
  description:
    "One free profile for everything you watch, play, read and hear: track progress, keep a diary, see your stats, import your lists and compare tastes with friends.",
  path: "/",
});

/**
 * The root: the landing page for a visitor, the home for a member. The
 * landing's questions go out as FAQPage structured data from the same
 * list the page renders.
 */
const HomePage = async () => {
  const user = await getCurrentUser();
  if (user && !user.username) {
    redirect("/welcome");
  }
  if (user) {
    return <MemberHome user={user} />;
  }

  return (
    <>
      <JsonLd data={graph([faqNode("/", LANDING_FAQ)])} />
      <Landing />
    </>
  );
};

export default HomePage;

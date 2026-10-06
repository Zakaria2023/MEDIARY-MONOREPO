import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTasteMatch } from "services";
import { CompareHero } from "@/components/compare/compare-hero";
import { CompareRefused } from "@/components/compare/compare-refused";
import { MediumMatches } from "@/components/compare/medium-matches";
import { TasteRecommendations } from "@/components/compare/taste-recommendations";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ username: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { username } = await params;
  return pageMetadata({
    title: `Taste Match with @${decodeURIComponent(username)}`,
    description: "How closely two Mediary members' tastes line up.",
    path: `/compare/${username}`,
    noIndex: true,
  });
};

/**
 * TASTE MATCH: the viewer against another member. Two avatars, the ring,
 * the per-medium numbers, what they both love, and what each would hand
 * the other. Private: it is about the viewer, and the other person's
 * setting decides whether it is on at all.
 */
const ComparePage = async ({ params }: Props) => {
  const { username } = await params;
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const viewer = await getCurrentUser();
  if (!viewer) {
    return null;
  }
  const result = await getTasteMatch(viewer.uuid, decodeURIComponent(username));
  if (!result) {
    notFound();
  }
  if (!result.allowed) {
    return <CompareRefused other={result.other} reason={result.reason} />;
  }
  const { page } = result;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10">
      <CompareHero viewer={viewer} page={page} />
      <MediumMatches byType={page.match.byType} />
      <TasteRecommendations viewerName="You" page={page} />
    </main>
  );
};

export default ComparePage;

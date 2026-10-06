import { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseLaunchMediaType } from "validators";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { LibraryView } from "@/components/library/library-view";
import { parseLibraryQuery } from "@/lib/library-query";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const mediaType = parseLaunchMediaType((await params).type);
  if (!mediaType) {
    return {};
  }
  return pageMetadata({
    title: `Your ${MEDIA_TYPE_PLURAL_LABELS[mediaType].toLowerCase()}`,
    description: "Everything you are watching, playing and planning, in one place.",
    path: `/library/${mediaType}`,
    noIndex: true,
  });
};

/** The library filtered to one medium. */
const LibraryTypePage = async ({ params, searchParams }: Props) => {
  const { type } = await params;
  if (!parseLaunchMediaType(type)) {
    notFound();
  }
  return <LibraryView query={parseLibraryQuery(type, await searchParams)} />;
};

export default LibraryTypePage;

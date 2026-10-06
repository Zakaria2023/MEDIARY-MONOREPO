import { Metadata } from "next";
import { LibraryView } from "@/components/library/library-view";
import { parseLibraryQuery } from "@/lib/library-query";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = pageMetadata({
  title: "Your library",
  description: "Everything you are watching, playing and planning, in one place.",
  path: "/library",
  noIndex: true,
});

/** The whole library, every medium together. Private, so never indexed. */
const LibraryPage = async ({ searchParams }: Props) => (
  <LibraryView query={parseLibraryQuery(undefined, await searchParams)} />
);

export default LibraryPage;

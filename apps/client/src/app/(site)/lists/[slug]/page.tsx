import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListEditor } from "@/components/lists/list-editor";
import { ListHeader } from "@/components/lists/list-header";
import { ListItems } from "@/components/lists/list-items";
import { ReportButton } from "@/components/social/report-button";
import { getCurrentUser } from "@/lib/auth";
import { JsonLd } from "@/components/seo/json-ld";
import { loadList } from "@/lib/load-list";
import { pageMetadata } from "@/lib/seo";
import { graph, itemListNode } from "@/lib/structured-data";

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const list = await loadList(slug);
  if (!list) {
    return { title: "List not found", robots: { index: false, follow: true } };
  }
  return pageMetadata({
    title: `${list.name}, a list by ${list.owner.displayName}`,
    description:
      list.description ??
      `${list.itemCount} titles ${list.owner.displayName} put together on Mediary.`,
    path: `/lists/${list.slug}`,
    noIndex: list.visibility !== "public" || list.itemCount === 0,
    image: list.previews[0]?.coverUrl ?? undefined,
  });
};

/**
 * A LIST'S PAGE, /lists/[slug]. The name, the owner and the titles render
 * on the server; the owner's tools, which need a click, are the one client
 * island. Who may see it was decided in the query.
 */
const ListPage = async ({ params }: Props) => {
  const { slug } = await params;
  const [list, viewer] = await Promise.all([loadList(slug), getCurrentUser()]);
  if (!list) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      {list.visibility === "public" && list.items.length > 0 && (
        <JsonLd data={graph([itemListNode(`/lists/${list.slug}`, list.name, list.items)])} />
      )}
      {list.relation === "owner" ? (
        <ListEditor list={list} />
      ) : (
        <>
          <ListHeader list={list} actions={viewer ? <ReportButton subject={{ kind: "list", uuid: list.uuid }} what="this list" /> : undefined} />
          <ListItems items={list.items} ranked={list.ranked} />
        </>
      )}
    </main>
  );
};

export default ListPage;

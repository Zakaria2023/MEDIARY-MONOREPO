import { Metadata } from "next";
import { listOwnLists } from "services";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { ListForm } from "@/components/lists/list-form";
import { ListGrid } from "@/components/lists/list-grid";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your lists",
  description: "The lists you curate.",
  path: "/lists",
  noIndex: true,
});

/** The owner's lists, with the form that makes a new one. */
const ListsPage = async () => {
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const lists = await listOwnLists(user.uuid);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Your lists"
        description="Any titles, any media, in the order you put them."
      />
      <ListForm />
      {lists.length === 0 ? (
        <CatalogEmptyState
          heading="No lists yet"
          body="Make one above, or press Add to list on any title."
          action={{ label: "Explore the catalog", href: "/explore" }}
        />
      ) : (
        <ListGrid lists={lists} />
      )}
    </main>
  );
};

export default ListsPage;

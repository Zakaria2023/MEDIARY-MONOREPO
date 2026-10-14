import { listAdminStoreLinks } from "services";
import { SectionTitle } from "@/components/shared/section-title";
import { StoreLinkForm } from "@/components/catalog/store-link-form";
import { StoreLinkRow } from "@/components/catalog/store-link-row";

type StoreLinksSectionProps = {
  mediaUuid: string;
  canEdit: boolean;
};

/**
 * WHERE TO GET IT, as staff manage it: the links the catalog works out by
 * itself, staff's own, and the hidden ones still listed so they can come
 * back. What shows on the title page is every one here that is not hidden.
 */
export const StoreLinksSection = async ({ mediaUuid, canEdit }: StoreLinksSectionProps) => {
  const links = await listAdminStoreLinks(mediaUuid);

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        title="Where to get it"
        description="Store links on the title page. A game's store page and a book's bookshops come by themselves; add the rest here."
      />
      {links.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline-strong px-4 py-6 text-center text-sm text-muted">
          No store links yet; the title page shows none.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <StoreLinkRow key={link.store} mediaUuid={mediaUuid} link={link} canEdit={canEdit} />
          ))}
        </ul>
      )}
      {canEdit && <StoreLinkForm mediaUuid={mediaUuid} />}
    </section>
  );
};

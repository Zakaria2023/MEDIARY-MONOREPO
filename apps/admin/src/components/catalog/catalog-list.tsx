import { Library, SearchX } from "lucide-react";
import Link from "next/link";
import { listAdminCatalog } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { MediaType } from "@/db/enum";
import { CatalogRow } from "@/components/catalog/catalog-row";

type CatalogListProps = {
  query: string;
  mediaType: MediaType | undefined;
  page: number;
};

/** The async half of the catalog screen: one page of rows, or why there are none. */
export const CatalogList = async ({ query, mediaType, page }: CatalogListProps) => {
  const result = await listAdminCatalog({ query, mediaType, page });

  if (result.total === 0) {
    const filtered = query.length > 0 || mediaType !== undefined;
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-faint">
          {filtered ? <SearchX size={22} /> : <Library size={22} />}
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg text-ink">
            {filtered ? "Nothing matches" : "The catalog is empty"}
          </p>
          <p className="max-w-sm text-sm text-muted">
            {filtered
              ? "No title has a name like that in this medium."
              : "Titles arrive from the providers. Import a list to fill it."}
          </p>
        </div>
        {!filtered && (
          <Link
            href="/imports"
            className="mt-1 inline-flex h-10 items-center rounded-control bg-action-gradient px-4 text-sm font-medium text-white"
          >
            Go to imports
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="tabular text-sm text-muted">
        {result.total.toLocaleString("en-US")} {result.total === 1 ? "title" : "titles"}
      </p>
      <ul className="flex flex-col gap-2">
        {result.items.map((row) => (
          <CatalogRow key={row.uuid} row={row} />
        ))}
      </ul>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => filterHref("/catalog", { q: query, type: mediaType, page: target })}
      />
    </div>
  );
};

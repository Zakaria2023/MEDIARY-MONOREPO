import { DownloadCloud } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { AsyncSection } from "ui";
import { firstParam, parseMediaType } from "validators";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogList } from "@/components/catalog/catalog-list";
import { CatalogListSkeleton } from "@/components/catalog/catalog-list-skeleton";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Catalog",
};

/**
 * Every title in the catalog, newest sync first, searchable by any of its
 * names and filterable by medium. The filters stay mounted; only the list
 * reloads when they change.
 */
const CatalogPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const query = firstParam(params.q)?.trim() ?? "";
  const mediaType = parseMediaType(firstParam(params.type));
  const page = Number(firstParam(params.page)) || 1;

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="Catalog"
        description="Every title Mediary knows, and where it came from."
        action={
          <Link
            href="/imports"
            className="inline-flex h-10 items-center gap-2 rounded-control bg-action-gradient px-4 text-sm font-medium text-white"
          >
            <DownloadCloud size={16} />
            Import titles
          </Link>
        }
      />
      <CatalogFilters query={query} mediaType={mediaType} />
      <AsyncSection
        reloadKey={`${query}|${mediaType ?? "all"}|${page}`}
        skeleton={<CatalogListSkeleton />}
      >
        <CatalogList query={query} mediaType={mediaType} page={page} />
      </AsyncSection>
    </div>
  );
};

export default CatalogPage;

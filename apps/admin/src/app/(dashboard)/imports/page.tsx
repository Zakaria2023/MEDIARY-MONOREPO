import { Metadata } from "next";
import { listProviderStatuses } from "services";
import { BulkImportForm } from "@/components/imports/bulk-import-form";
import { ProviderSearch } from "@/components/imports/provider-search";
import { ProviderStatusCard } from "@/components/imports/provider-status-card";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionTitle } from "@/components/shared/section-title";
import { importSources } from "@/lib/import-sources";

export const metadata: Metadata = {
  title: "Imports",
};

/**
 * WHERE THE CATALOG COMES FROM. The public site never calls a provider; every
 * title it shows was brought in here, one at a time from a search or a list
 * at a time, and kept fresh by the daily refresh.
 */
const ImportsPage = () => {
  const statuses = listProviderStatuses();
  const sources = importSources(statuses);

  return (
    <div className="flex flex-col gap-10">
      <PageHeading
        title="Imports"
        description="Bring titles in from the catalog providers. Anime arrives once its source is chosen."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statuses.map((status) => (
          <ProviderStatusCard key={status.provider} status={status} />
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Find a title"
          description="Search a provider by name. Titles already in the catalog are marked."
        />
        <ProviderSearch sources={sources} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Import a list"
          description="Fill the catalog from what is trending, popular, highest rated or coming soon, a hundred titles at a time."
        />
        <BulkImportForm sources={sources} />
      </section>
    </div>
  );
};

export default ImportsPage;

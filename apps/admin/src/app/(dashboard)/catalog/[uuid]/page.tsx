import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogFacts } from "services";
import { Badge, Poster } from "ui";
import { formatDate } from "utils";
import {
  MEDIA_STATUS_LABELS,
  MEDIA_TYPE_LABELS,
  PROVIDER_LABELS,
  TITLE_TYPE_LABELS,
} from "@/db/label";
import { FactList } from "@/components/catalog/fact-list";
import { RefreshButton } from "@/components/catalog/refresh-button";
import { SectionTitle } from "@/components/shared/section-title";
import { loadCatalogTitle } from "@/lib/load-catalog-title";
import { publicTitleUrl } from "@/lib/site";

type Props = {
  params: Promise<{ uuid: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const title = await loadCatalogTitle((await params).uuid);
  return { title: title?.canonicalTitle ?? "Title not found" };
};

/**
 * One catalog title as staff see it: what the public page shows, plus where
 * every fact came from, when it was last synced and which fields an admin
 * has locked against a provider refresh.
 */
const CatalogTitlePage = async ({ params }: Props) => {
  const { uuid } = await params;
  const title = await loadCatalogTitle(uuid);
  if (!title) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-10">
      <Link
        href="/catalog"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} />
        Catalog
      </Link>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="w-32 shrink-0 sm:w-40">
          <Poster
            src={title.coverUrl}
            alt={title.canonicalTitle}
            sizes="160px"
            dominantColor={title.dominantColor}
            priority
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{MEDIA_TYPE_LABELS[title.mediaType]}</Badge>
            {title.releaseYear && <Badge>{title.releaseYear}</Badge>}
            <Badge>{MEDIA_STATUS_LABELS[title.status]}</Badge>
            {title.providerScore !== null && <Badge tone="warning">{title.providerScore.toFixed(1)}</Badge>}
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-4xl">
            {title.canonicalTitle}
          </h1>
          <div className="flex flex-wrap items-start gap-2">
            <RefreshButton uuid={title.uuid} />
            <a
              href={publicTitleUrl(title.mediaType, title.slug)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
            >
              <ExternalLink size={16} />
              View on Mediary
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <SectionTitle title="Details" />
            <FactList facts={catalogFacts(title)} />
            {title.description && (
              <p className="max-w-2xl text-sm leading-relaxed text-secondary">{title.description}</p>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <SectionTitle title="Genres and platforms" />
            <div className="flex flex-wrap gap-1.5">
              {title.genres.length === 0 && title.platforms.length === 0 && (
                <span className="text-sm text-muted">None mapped.</span>
              )}
              {title.genres.map((genre) => (
                <Badge key={genre.slug}>{genre.name}</Badge>
              ))}
              {title.platforms.map((platform) => (
                <Badge key={platform.slug} tone="violet">
                  {platform.abbreviation}
                </Badge>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionTitle title="Names" description="Every name search matches this title by." />
            <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
              {title.titles.map((entry) => (
                <li
                  key={`${entry.titleType}:${entry.title}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="text-ink">{entry.title}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {TITLE_TYPE_LABELS[entry.titleType]}
                    {entry.language ? ` · ${entry.language}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <SectionTitle title="Sources" />
            <ul className="flex flex-col gap-2">
              {title.refs.map((ref) => (
                <li
                  key={`${ref.provider}:${ref.externalId}`}
                  className="flex items-center justify-between gap-3 rounded-card border border-hairline px-4 py-3 text-sm"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-ink">{PROVIDER_LABELS[ref.provider]}</span>
                    <span className="line-clamp-1 font-mono text-xs text-muted">{ref.externalId}</span>
                  </div>
                  {ref.externalUrl && (
                    <a
                      href={ref.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open on ${PROVIDER_LABELS[ref.provider]}`}
                      className="shrink-0 text-muted transition-colors hover:text-ink"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <SectionTitle title="Sync" />
            <FactList
              facts={[
                { label: "Last synced", value: formatDate(title.lastSyncedAt) },
                { label: "Added", value: formatDate(title.createdAt) },
                { label: "Slug", value: title.slug },
              ]}
            />
            <div className="flex items-start gap-2 text-sm text-muted">
              <Lock size={16} className="mt-0.5 shrink-0" />
              {title.lockedFields.length > 0
                ? `Locked against refresh: ${title.lockedFields.join(", ")}.`
                : "Nothing is locked; a refresh may update every field."}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default CatalogTitlePage;

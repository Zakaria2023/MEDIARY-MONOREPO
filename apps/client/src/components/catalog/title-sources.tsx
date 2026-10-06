import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { attributionsFor, CatalogRef } from "services";
import { PROVIDER_LABELS } from "@/db/label";

type TitleSourcesProps = {
  refs: CatalogRef[];
};

/**
 * Where else this title lives, as links out, and the attribution each
 * provider that supplied this page's data requires. Read from the refs, so
 * a game page credits IGDB and a movie page credits TMDB without either
 * being named here.
 */
export const TitleSources = ({ refs }: TitleSourcesProps) => {
  const links = refs.filter((ref) => ref.externalUrl);
  const attributions = attributionsFor(refs.map((ref) => ref.provider));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Elsewhere</h2>
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {links.map((ref) => (
            <li key={`${ref.provider}:${ref.externalId}`}>
              <a
                href={ref.externalUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-hairline px-3 text-sm text-secondary transition-colors hover:border-hairline-strong hover:text-ink"
              >
                {PROVIDER_LABELS[ref.provider]}
                <ExternalLink size={14} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {attributions.map((attribution) => (
        <p key={attribution.provider} className="flex flex-wrap items-center gap-2 text-xs text-faint">
          {attribution.logoPath && (
            <Image src={attribution.logoPath} alt={attribution.name} width={80} height={10} />
          )}
          {attribution.text}
        </p>
      ))}
    </section>
  );
};

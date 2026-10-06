import Image from "next/image";
import Link from "next/link";
import { allAttributions } from "services";
import { launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { Logo } from "@/components/shared/logo";
import { SITE_TAGLINE } from "@/lib/seo";

/**
 * The foot of every public page: the mark, a link to each medium's page (the
 * site's main internal links, which crawlers follow), and the attribution
 * every catalog provider requires. Attribution is read from the adapters,
 * so a new provider brings its own line and nothing here changes.
 */
export const SiteFooter = () => (
  <footer className="mt-16 border-t border-hairline">
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3">
          <Link href="/" aria-label="Mediary home" className="w-fit">
            <Logo />
          </Link>
          <p className="max-w-xs text-sm text-muted">{SITE_TAGLINE}.</p>
        </div>
        <nav aria-label="Explore" className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-faint">Explore</span>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <li>
              <Link href="/explore" className="text-secondary transition-colors hover:text-ink">
                Everything
              </Link>
            </li>
            {launchMediaTypes.map((type) => (
              <li key={type}>
                <Link
                  href={`/explore/${type}`}
                  className="text-secondary transition-colors hover:text-ink"
                >
                  {MEDIA_TYPE_PLURAL_LABELS[type]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-hairline pt-8">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">Data sources</span>
        <ul className="flex flex-col gap-3">
          {allAttributions().map((attribution) => (
            <li key={attribution.provider} className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <a href={attribution.url} target="_blank" rel="noreferrer" aria-label={attribution.name}>
                {attribution.logoPath ? (
                  <Image src={attribution.logoPath} alt={attribution.name} width={96} height={12} />
                ) : (
                  <span className="font-medium text-secondary">{attribution.name}</span>
                )}
              </a>
              <span>{attribution.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-faint">© {new Date().getFullYear()} Mediary</p>
    </div>
  </footer>
);

import { ExternalLink } from "lucide-react";
import { StoreLink } from "services";
import { STORE_LABELS, STORE_LINK_KIND_LABELS } from "@/db/label";
import { storeLinkPath } from "@/lib/store-link-path";

type StoreLinksProps = {
  mediaUuid: string;
  links: StoreLink[];
};

/**
 * WHERE TO GET IT, under a title's details and apart from its score and
 * reviews, which no store has any say in. Each link opens the store in a
 * new tab through /go/store, which counts the press. No store pays for its
 * place here, and the line under the links says so; the day one does, that
 * line changes in the same commit.
 */
export const StoreLinks = ({ mediaUuid, links }: StoreLinksProps) => (
  <section aria-labelledby="where-to-get-it" className="flex flex-col gap-3">
    <h2 id="where-to-get-it" className="text-xs font-medium uppercase tracking-wide text-faint">
      Where to get it
    </h2>
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => (
        <li key={link.store}>
          {/* A plain anchor on purpose: /go is a redirect that counts, and a prefetching Link would count a press nobody made. */}
          <a
            href={storeLinkPath(mediaUuid, link.store)}
            target="_blank"
            rel="nofollow noopener"
            className="inline-flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm text-ink transition-colors hover:bg-hover"
          >
            <span className="text-muted">{STORE_LINK_KIND_LABELS[link.kind]}</span>
            <span className="font-medium">{STORE_LABELS[link.store]}</span>
            <ExternalLink size={14} className="text-muted" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
    <p className="text-xs text-muted">Links open the store&apos;s own page. No store pays Mediary to be listed here.</p>
  </section>
);

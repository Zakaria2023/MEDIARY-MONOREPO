import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AuthUser } from "services";
import { launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { Logo } from "@/components/shared/logo";

type SiteFooterProps = {
  /** The viewer, so the second column offers what is theirs. */
  user: AuthUser | null;
};

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

const EXPLORE_COLUMN: FooterColumn = {
  heading: "Explore",
  links: [
    { label: "Everything", href: "/explore" },
    ...launchMediaTypes.map((type) => ({
      label: MEDIA_TYPE_PLURAL_LABELS[type],
      href: `/explore/${type}`,
    })),
  ],
};

const MEMBER_COLUMN: FooterColumn = {
  heading: "Your Mediary",
  links: [
    { label: "Home", href: "/" },
    { label: "Library", href: "/library" },
    { label: "Search", href: "/search" },
    { label: "Settings", href: "/settings/profile" },
  ],
};

const VISITOR_COLUMN: FooterColumn = {
  heading: "Account",
  links: [
    { label: "Sign in", href: "/sign-in" },
    { label: "Create your Mediary", href: "/sign-up" },
    { label: "Search", href: "/search" },
  ],
};

const LINK_CLASSES = "text-sm text-secondary transition-colors hover:text-ink";

/**
 * The foot of every public page. The brand and its one-line promise on the
 * start edge, two columns of the site's own links on the end edge, and the
 * copyright under a hairline. The links are the main internal paths a
 * crawler follows. No third-party service is named here or anywhere else
 * on screen (CLAUDE.md).
 */
export const SiteFooter = ({ user }: SiteFooterProps) => {
  const columns = [EXPLORE_COLUMN, user ? MEMBER_COLUMN : VISITOR_COLUMN];

  return (
    <footer className="mt-20 border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-14 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8">
          <div className="flex max-w-sm flex-col gap-5">
            <Link href="/" aria-label="Mediary home" className="w-fit">
              <Logo height={32} />
            </Link>
            <p className="font-display text-xl leading-snug text-ink">
              Everything you watch, play and finish, in one place.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Track anime, games, movies and TV with the same gestures, and keep
              the whole story of what you have seen.
            </p>
            {!user && (
              <Link
                href="/sign-up"
                className="inline-flex h-10 w-fit items-center gap-1.5 rounded-control bg-action-gradient px-4 text-sm font-medium text-white"
              >
                Start your library
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
                {column.heading}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK_CLASSES}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mediary. All media, one profile.</p>
          <p>Made for people who finish things.</p>
        </div>
      </div>
    </footer>
  );
};

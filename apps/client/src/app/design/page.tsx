import Link from "next/link";
import { PrimitivesShowcase } from "@/components/design/primitives-showcase";
import { TokenSwatches } from "@/components/design/token-swatches";
import { TypeScale } from "@/components/design/type-scale";
import { PosterCard } from "@/components/media/poster-card";
import { Logo } from "@/components/shared/logo";
import { SectionHeading } from "@/components/shared/section-heading";
import { TITLES } from "@/lib/design/mock";

const SCREENS: { href: string; title: string; note: string }[] = [
  { href: "/design/home", title: "Home", note: "Continue, the week, discovery, friends" },
  { href: "/design/explore", title: "Explore", note: "Filters, rails, the poster grid" },
  { href: "/design/detail", title: "Media detail", note: "Hero, your status, community, related" },
  { href: "/design/add", title: "Add / update sheet", note: "The heartbeat, open over a detail page" },
  { href: "/design/library", title: "Library", note: "Status tabs, density, inline increment" },
  { href: "/design/profile", title: "Public profile", note: "Favorites, Taste DNA, compare CTA" },
  { href: "/design/stats", title: "Statistics", note: "Totals, months, ratings, genres" },
  { href: "/design/compare", title: "Taste Match", note: "The ring, per-medium, shared favorites" },
];

/**
 * THE DESIGN SANDBOX. Step 0 of the roadmap: every token, the type scale,
 * every primitive in every state, and the high-fidelity prototype of each
 * core screen, so the visual system is settled before the product is built
 * on it. Resize the window: every screen has its phone layout.
 */
const DesignIndex = () => (
  <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-10 sm:px-8">
    <header className="flex flex-col gap-6">
      <Logo />
      <SectionHeading
        size="page"
        title="Design foundation"
        description="Tokens, type, primitives and the prototype of every core screen."
      />
    </header>

    <section className="flex flex-col gap-5">
      <SectionHeading title="Screens" description="Static prototypes on mock data. Nothing here reads a database." />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SCREENS.map((screen) => (
          <li key={screen.href}>
            <Link
              href={screen.href}
              className="flex h-full flex-col gap-1 rounded-card border border-hairline bg-surface p-4 transition-colors hover:border-hairline-strong hover:bg-hover"
            >
              <span className="font-display text-base text-ink">{screen.title}</span>
              <span className="text-sm text-muted">{screen.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>

    <section className="flex flex-col gap-5">
      <SectionHeading title="Color" description="Every token and the job it does. One or two accents per screen." />
      <TokenSwatches />
    </section>

    <section className="flex flex-col gap-5">
      <SectionHeading title="Type" description="Sora for display, Manrope for text, JetBrains Mono for numbers." />
      <TypeScale />
    </section>

    <section className="flex flex-col gap-5">
      <SectionHeading title="Primitives" description="From packages/ui. Every state worth seeing." />
      <PrimitivesShowcase />
    </section>

    <section className="flex flex-col gap-5">
      <SectionHeading title="The poster card" description="The unit of every grid and rail. Hover one." />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
        {TITLES.slice(0, 6).map((title) => (
          <PosterCard key={title.slug} title={title} showType />
        ))}
      </div>
    </section>
  </div>
);

export default DesignIndex;

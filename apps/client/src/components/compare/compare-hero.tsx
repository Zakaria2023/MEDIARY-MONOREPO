import { Download } from "lucide-react";
import { AuthUser, TasteMatchPage } from "services";
import { MatchRing } from "@/components/compare/match-ring";
import { UserAvatar } from "@/components/profile/user-avatar";
import { matchSentence } from "@/lib/compare-copy";

type CompareHeroProps = {
  viewer: AuthUser;
  page: TasteMatchPage;
};

/**
 * The card at the top of a Taste Match: both avatars, the ring between
 * them, a sentence about it, and the card to share. The soft brand wash
 * behind it is one of the gradient's permitted places.
 */
export const CompareHero = ({ viewer, page }: CompareHeroProps) => (
  <section className="relative overflow-hidden rounded-card border border-hairline bg-surface p-6 sm:p-10">
    <div className="pointer-events-none absolute inset-0 bg-brand-gradient-soft opacity-60" />
    <div className="relative flex flex-col items-center gap-6">
      <div className="flex items-center gap-6 sm:gap-10">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar name={viewer.displayName} imageUrl={viewer.imageUrl} size="xl" />
          <span className="text-sm font-medium text-ink">You</span>
        </div>
        <MatchRing value={page.match.overall} />
        <div className="flex flex-col items-center gap-2">
          <UserAvatar name={page.other.displayName} imageUrl={page.other.imageUrl} size="xl" />
          <span className="text-sm font-medium text-ink">{page.other.displayName}</span>
        </div>
      </div>
      <p className="max-w-md text-center text-sm text-muted">{matchSentence(page)}</p>
      {page.other.username && (
        <a
          href={`/compare/${page.other.username}/card`}
          download={`mediary-taste-match-${page.other.username}.png`}
          className="inline-flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
        >
          <Download size={16} />
          Save the match card
        </a>
      )}
    </div>
  </section>
);

import { Share2 } from "lucide-react";
import { Button } from "ui";
import { MatchRing } from "@/components/compare/match-ring";
import { PosterCard } from "@/components/media/poster-card";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar } from "@/components/shared/avatar";
import { SectionHeading } from "@/components/shared/section-heading";
import { COMPARISON, FRIENDS, ME, MEDIA_TYPE_LABEL } from "@/lib/design/mock";

/**
 * PROTOTYPE: Taste Match. Two avatars, the ring between them, the per-medium
 * breakdown, the shared favorites, and what each would recommend the other.
 * The card at the top is what the share image is rendered from.
 */
const ComparePrototype = () => {
  const other = FRIENDS[0];
  if (!other) {
    throw new Error("Mock data is missing a friend");
  }

  return (
    <AppShell current="none">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-8 sm:px-8">
        <section className="relative overflow-hidden rounded-card border border-hairline bg-surface p-6 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-brand-gradient-soft opacity-60" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="flex flex-col items-center gap-2">
                <Avatar user={ME} size="xl" />
                <span className="text-sm font-medium text-ink">You</span>
              </div>
              <MatchRing value={COMPARISON.overall} />
              <div className="flex flex-col items-center gap-2">
                <Avatar user={other} size="xl" />
                <span className="text-sm font-medium text-ink">{other.displayName}</span>
              </div>
            </div>
            <p className="max-w-md text-center text-sm text-muted">
              You agree on almost everything in anime and games, and argue about
              films. High confidence: 48 titles in common.
            </p>
            <Button variant="outline">
              <Share2 size={16} />
              Share this match
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COMPARISON.byType.map((item) => (
            <div key={item.type} className="flex flex-col gap-2 rounded-card border border-hairline bg-surface p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-faint">
                {MEDIA_TYPE_LABEL[item.type]}
              </span>
              <span className="tabular font-display text-2xl font-semibold text-ink">{item.value}%</span>
              <div className="h-1.5 w-full overflow-hidden rounded-chip bg-hairline">
                <div className="h-full rounded-chip bg-accent" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="Shared favorites" description="Both of you rated these 9 or higher." />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
            {COMPARISON.shared.map((title) => (
              <PosterCard key={title.slug} title={title} showType />
            ))}
          </div>
        </section>

        <div className="grid gap-8 sm:grid-cols-2">
          <section className="flex flex-col gap-4">
            <SectionHeading title={`${other.displayName} loves, you have not tried`} />
            <div className="grid grid-cols-2 gap-3">
              {COMPARISON.theyLove.map((title) => (
                <PosterCard key={title.slug} title={title} showType />
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <SectionHeading title={`You love, ${other.displayName} has not tried`} />
            <div className="grid grid-cols-2 gap-3">
              {COMPARISON.youLove.map((title) => (
                <PosterCard key={title.slug} title={title} showType />
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default ComparePrototype;

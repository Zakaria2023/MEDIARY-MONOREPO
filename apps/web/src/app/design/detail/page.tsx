import { Avatar } from "@/components/shared/avatar";
import { DetailHero } from "@/components/media/detail-hero";
import { MediaRail } from "@/components/media/media-rail";
import { RatingDistribution } from "@/components/media/rating-distribution";
import { YourStatusPanel } from "@/components/media/your-status-panel";
import { AppShell } from "@/components/shared/app-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  CONTINUE,
  FRIENDS,
  RATING_DISTRIBUTION,
  byType,
  find,
} from "@/lib/design/mock";

/**
 * PROTOTYPE: a media detail page. The hero carries the poster, title and the
 * one primary action; under it a two-column body: the description, metadata
 * and community on the wide side, the viewer's own status pinned on the
 * narrow side. Related titles come last and load after everything above.
 */
const DetailPrototype = () => {
  const title = find("frieren");
  const entry = CONTINUE[0];
  if (!entry) {
    throw new Error("Mock data is missing the first entry");
  }

  return (
    <AppShell current="none">
      <DetailHero title={title} />

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
              About
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-secondary">
              After the party of heroes defeats the Demon King, the elven mage
              Frieren sets out again, decades later, to understand the people
              she travelled with and the feelings she never took the time to
              notice. A quiet, patient story about time and what it leaves
              behind.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              {[
                ["Format", "TV"],
                ["Episodes", "28"],
                ["Season", "Fall 2023"],
                ["Studio", "Madhouse"],
                ["Source", "Manga"],
                ["Episode length", "24 min"],
                ["Status", "Finished"],
                ["Genres", title.genres.join(", ")],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
                Community ratings
              </h2>
              <RatingDistribution counts={RATING_DISTRIBUTION} highlight={9} />
            </div>
            <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-faint">
                Friends
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {FRIENDS.map((friend) => (
                    <Avatar key={friend.username} user={friend} size="sm" />
                  ))}
                </div>
                <p className="text-sm text-muted">
                  <span className="text-ink">3 friends</span> have watched this.
                  Ahmad gave it a 10.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <YourStatusPanel entry={entry} />
        </aside>
      </div>

      <div className="flex flex-col gap-10 pb-10">
        <MediaRail
          title="More like this"
          reason="Quiet fantasy with time at its center."
          titles={[...byType("anime").filter((item) => item.slug !== title.slug), ...byType("movie").slice(0, 2)]}
          showType
        />
        <div className="px-5 sm:px-8">
          <SectionHeading
            title="Reviews"
            description="Reviews land here once the community layer ships."
          />
        </div>
      </div>
    </AppShell>
  );
};

export default DetailPrototype;

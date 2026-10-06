import { PosterCard } from "@/components/media/poster-card";
import { ProfileHero } from "@/components/profile/profile-hero";
import { TasteDna } from "@/components/profile/taste-dna";
import { AppShell } from "@/components/shared/app-shell";
import { DiaryList } from "@/components/shared/diary-list";
import { EntryRow } from "@/components/shared/entry-row";
import { SectionHeading } from "@/components/shared/section-heading";
import { CONTINUE, DIARY, FRIENDS, TASTE, find } from "@/lib/design/mock";

const FAVORITES = [
  find("attack-on-titan"),
  find("elden-ring"),
  find("interstellar"),
  find("breaking-bad"),
  find("baldurs-gate-3"),
  find("frieren"),
];

const SPLIT: [string, number, string][] = [
  ["Anime", 38, "bg-accent"],
  ["Games", 27, "bg-violet"],
  ["Movies", 22, "bg-magenta"],
  ["TV", 13, "bg-pink"],
];

/**
 * PROTOTYPE: a public profile, viewed as somebody else so the Compare Taste
 * action shows. Favorites get the artwork treatment; Taste DNA and the media
 * split sit beside each other; then what they are into now and recently.
 */
const ProfilePrototype = () => {
  const ahmad = FRIENDS[0];
  if (!ahmad) {
    throw new Error("Mock data is missing a friend");
  }

  return (
    <AppShell current="profile">
      <ProfileHero user={ahmad} isOther />

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8">
        <section className="flex flex-col gap-4">
          <SectionHeading title="Favorites" description="The six that define the taste." />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {FAVORITES.map((title) => (
              <PosterCard key={title.slug} title={title} showType />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
            <SectionHeading title="Taste DNA" description="From ratings, completions and tags." />
            <TasteDna traits={TASTE} />
          </section>

          <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
            <SectionHeading title="Media split" description="Share of tracked time." />
            <div className="flex h-3 w-full overflow-hidden rounded-chip">
              {SPLIT.map(([label, value, color]) => (
                <div key={label} className={color} style={{ width: `${value}%` }} title={label} />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {SPLIT.map(([label, value, color]) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="text-secondary">{label}</span>
                  <span className="ms-auto tabular text-ink">{value}%</span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-3 gap-3 border-t border-hairline pt-4 text-sm">
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Average score</dt>
                <dd className="tabular font-display text-lg text-ink">8.1</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Completion</dt>
                <dd className="tabular font-display text-lg text-ink">78%</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Top genre</dt>
                <dd className="font-display text-lg text-ink">Drama</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeading title="Currently" description="What they are in the middle of." />
          <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
            {CONTINUE.slice(0, 4).map((entry) => (
              <EntryRow key={entry.title.slug} entry={entry} layout="compact" />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="Recent activity" />
          <div className="rounded-card border border-hairline bg-surface px-4">
            <DiaryList lines={DIARY} />
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default ProfilePrototype;

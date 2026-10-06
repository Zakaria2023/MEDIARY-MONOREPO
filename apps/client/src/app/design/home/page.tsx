import { MediaRail } from "@/components/media/media-rail";
import { FriendsActivity } from "@/components/home/friends-activity";
import { WeeklySnapshot } from "@/components/home/weekly-snapshot";
import { AppShell } from "@/components/shared/app-shell";
import { DiaryList } from "@/components/shared/diary-list";
import { EntryRow } from "@/components/shared/entry-row";
import { SectionHeading } from "@/components/shared/section-heading";
import { CONTINUE, DIARY, byType, ME } from "@/lib/design/mock";

/**
 * PROTOTYPE: home after sign-in. Continue first, because the person opening
 * the app most often wants to log the thing they just finished an hour of;
 * then the week in four numbers; then discovery; then friends.
 */
const HomePrototype = () => (
  <AppShell current="home">
    <div className="mx-auto flex max-w-7xl flex-col gap-10 py-6 sm:py-8">
      <div className="px-5 sm:px-8">
        <SectionHeading
          size="page"
          title={`Welcome back, ${ME.displayName}`}
          description="Pick up where you left off."
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="px-5 sm:px-8">
          <h2 className="font-display text-lg text-ink">Continue</h2>
        </div>
        <div className="scrollbar-none flex gap-3 overflow-x-auto px-5 pb-1 sm:px-8">
          {CONTINUE.map((entry) => (
            <EntryRow key={entry.title.slug} entry={entry} layout="compact" />
          ))}
        </div>
      </section>

      <div className="px-5 sm:px-8">
        <WeeklySnapshot />
      </div>

      <MediaRail
        title="Because you finished Attack on Titan"
        reason="Dark, story-driven, with a world that keeps widening."
        href="/design/explore"
        titles={[...byType("anime").slice(1), ...byType("tv").slice(0, 2)]}
        showType
      />

      <MediaRail
        title="New this week"
        href="/design/explore"
        titles={[...byType("game"), ...byType("movie").slice(0, 2)]}
        showType
      />

      <div className="grid gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_380px]">
        <section className="flex flex-col gap-4">
          <SectionHeading title="Your diary" description="The last few days." />
          <div className="rounded-card border border-hairline bg-surface px-4">
            <DiaryList lines={DIARY.slice(0, 5)} />
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeading title="Friends" description="What they are into." />
          <FriendsActivity />
        </section>
      </div>
    </div>
  </AppShell>
);

export default HomePrototype;

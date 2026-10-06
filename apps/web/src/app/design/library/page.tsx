import { LibraryToolbar } from "@/components/library/library-toolbar";
import { MediaTypeTabs } from "@/components/library/media-type-tabs";
import { AppShell } from "@/components/shared/app-shell";
import { EntryRow } from "@/components/shared/entry-row";
import { SectionHeading } from "@/components/shared/section-heading";
import { LIBRARY, MockStatus } from "@/lib/design/mock";

const count = (status: MockStatus) =>
  LIBRARY.filter((entry) => entry.status === status).length;

/**
 * PROTOTYPE: the library in its row density. A medium filter above, the
 * status tabs with counts, then one line per entry with its status, progress
 * and score in columns on a desktop and folded into the second line on a
 * phone. The plus on every row is the one-tap increment.
 */
const LibraryPrototype = () => (
  <AppShell current="library">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 py-6 sm:py-8">
      <div className="flex flex-col gap-5 px-5 sm:px-8">
        <SectionHeading
          size="page"
          title="My Library"
          description={`${LIBRARY.length} titles across four media.`}
          action={<MediaTypeTabs />}
        />
        <LibraryToolbar
          counts={{
            all: LIBRARY.length,
            in_progress: count("in_progress"),
            completed: count("completed"),
            paused: count("paused"),
            dropped: count("dropped"),
            planned: count("planned"),
          }}
        />
      </div>

      <div className="flex flex-col">
        <div className="hidden grid-cols-[auto_1fr_140px_120px_80px_auto] gap-4 px-8 pb-2 text-xs font-medium uppercase tracking-wide text-faint sm:grid">
          <span className="w-10" />
          <span>Title</span>
          <span>Status</span>
          <span>Progress</span>
          <span>Score</span>
          <span className="w-8" />
        </div>
        {LIBRARY.map((entry) => (
          <EntryRow key={entry.title.slug} entry={entry} />
        ))}
      </div>
    </div>
  </AppShell>
);

export default LibraryPrototype;

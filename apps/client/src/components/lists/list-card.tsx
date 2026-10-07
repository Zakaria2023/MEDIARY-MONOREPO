import { Lock, Pin, Users } from "lucide-react";
import Link from "next/link";
import { ListSummary } from "services";
import { Poster } from "ui";
import { formatCount } from "utils";
import { PinListButton } from "@/components/lists/pin-list-button";

type ListCardProps = {
  list: ListSummary;
  /** The owner's name under the list, on a page that mixes owners. */
  showOwner?: boolean;
  /** On the owner's own page: the pin that puts it on the profile. */
  pinnable?: boolean;
};

const PREVIEW_SLOTS = 4;

/**
 * A list as a card: its first four covers in a 2x2, the name, how many
 * titles, and a lock or a people mark when it is not public. The whole
 * card is a link to the list.
 */
export const ListCard = ({ list, showOwner = false, pinnable = false }: ListCardProps) => (
  <article className="group relative flex flex-col gap-2.5">
    <Link
      href={`/lists/${list.slug}`}
      aria-label={list.name}
      className="absolute inset-0 z-10 rounded-card"
    />
    {pinnable && <PinListButton listUuid={list.uuid} name={list.name} initialPinned={list.pinnedAt !== null} />}
    <div className="grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-card ring-1 ring-hairline transition-shadow group-hover:ring-hairline-strong">
      {Array.from({ length: PREVIEW_SLOTS }, (_, index) => {
        const preview = list.previews[index];
        return preview ? (
          <div key={preview.uuid} className="relative overflow-hidden">
            <Poster
              src={preview.coverUrl}
              alt=""
              sizes="120px"
              dominantColor={preview.dominantColor}
              className="h-full rounded-none ring-0"
            />
          </div>
        ) : (
          <div key={index} className="bg-surface-2" />
        );
      })}
    </div>
    <div className="flex min-w-0 flex-col gap-0.5">
      <h3 className="line-clamp-1 flex items-center gap-1.5 text-sm font-medium text-ink">
        {list.pinnedAt !== null && !pinnable && <Pin size={13} className="shrink-0 fill-current text-accent" />}
        {list.visibility === "private" && <Lock size={13} className="shrink-0 text-muted" />}
        {list.visibility === "followers" && <Users size={13} className="shrink-0 text-muted" />}
        <span className="line-clamp-1">{list.name}</span>
      </h3>
      <p className="line-clamp-1 text-xs text-muted">
        {formatCount(list.itemCount)} {list.itemCount === 1 ? "title" : "titles"}
        {showOwner ? ` · ${list.owner.displayName}` : ""}
      </p>
    </div>
  </article>
);

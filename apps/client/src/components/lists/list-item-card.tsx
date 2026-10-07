import { ChevronDown, ChevronUp, X } from "lucide-react";
import { ListItem } from "services";
import { TitleCard } from "@/components/catalog/title-card";

type ListItemCardProps = {
  item: ListItem;
  /** One-based, the owner's order; null on an unranked list, which shows no number. */
  position: number | null;
  onRemove?: (mediaUuid: string) => void;
  isRemoving?: boolean;
  onMove?: (mediaUuid: string, direction: "up" | "down") => void;
  isMoving?: boolean;
  first?: boolean;
  last?: boolean;
};

const CARD_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw";

/**
 * A title on a list: the catalog card with its place number, the owner's
 * note under it, and, for the owner, a remove button above the card's
 * link.
 */
export const ListItemCard = ({ item, position, onRemove, isRemoving = false, onMove, isMoving = false, first = false, last = false }: ListItemCardProps) => (
  <div className="relative flex flex-col gap-2">
    {position !== null && (
      <span className="tabular absolute start-2 top-2 z-20 rounded-chip bg-overlay/90 px-1.5 py-0.5 text-xs text-ink">
        {position}
      </span>
    )}
    {onMove && (
      <span className="absolute bottom-2 end-2 z-20 flex flex-col gap-1">
        <button
          type="button"
          aria-label={`Move ${item.canonicalTitle} up`}
          onClick={() => onMove(item.uuid, "up")}
          disabled={isMoving || first}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-chip border border-hairline bg-overlay/90 text-ink transition-colors hover:text-accent disabled:opacity-40"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          aria-label={`Move ${item.canonicalTitle} down`}
          onClick={() => onMove(item.uuid, "down")}
          disabled={isMoving || last}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-chip border border-hairline bg-overlay/90 text-ink transition-colors hover:text-accent disabled:opacity-40"
        >
          <ChevronDown size={14} />
        </button>
      </span>
    )}
    {onRemove && (
      <button
        type="button"
        aria-label={`Take ${item.canonicalTitle} off the list`}
        onClick={() => onRemove(item.uuid)}
        disabled={isRemoving}
        className="absolute end-2 top-2 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-chip border border-hairline bg-overlay/90 text-ink transition-colors hover:text-danger disabled:opacity-60"
      >
        <X size={14} />
      </button>
    )}
    <TitleCard title={item} showType sizes={CARD_SIZES} />
    {item.note && <p className="line-clamp-3 text-xs text-muted">{item.note}</p>}
  </div>
);

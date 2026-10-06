import { X } from "lucide-react";
import { ListItem } from "services";
import { TitleCard } from "@/components/catalog/title-card";

type ListItemCardProps = {
  item: ListItem;
  /** One-based, the owner's order. */
  position: number;
  onRemove?: (mediaUuid: string) => void;
  isRemoving?: boolean;
};

const CARD_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw";

/**
 * A title on a list: the catalog card with its place number, the owner's
 * note under it, and, for the owner, a remove button above the card's
 * link.
 */
export const ListItemCard = ({ item, position, onRemove, isRemoving = false }: ListItemCardProps) => (
  <div className="relative flex flex-col gap-2">
    <span className="tabular absolute start-2 top-2 z-20 rounded-chip bg-overlay/90 px-1.5 py-0.5 text-xs text-ink">
      {position}
    </span>
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

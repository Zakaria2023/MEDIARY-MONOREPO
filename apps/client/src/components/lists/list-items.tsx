import { ListItem } from "services";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { GRID_CLASSES } from "@/components/catalog/title-grid";
import { ListItemCard } from "@/components/lists/list-item-card";

type ListItemsProps = {
  items: ListItem[];
  /** A ranked list numbers its titles. */
  ranked: boolean;
  /** The owner's remove, when the viewer owns the list. */
  onRemove?: (mediaUuid: string) => void;
  isRemoving?: boolean;
  /** The owner's up and down, on a ranked list. */
  onMove?: (mediaUuid: string, direction: "up" | "down") => void;
  isMoving?: boolean;
};

/** The titles on a list, in the owner's order, or a sentence for an empty one. */
export const ListItems = ({ items, ranked, onRemove, isRemoving = false, onMove, isMoving = false }: ListItemsProps) =>
  items.length === 0 ? (
    <CatalogEmptyState
      heading="Nothing on this list yet"
      body={
        onRemove
          ? "Open any title and press Add to list to put it here."
          : "The owner has not added anything yet."
      }
      action={onRemove ? { label: "Explore the catalog", href: "/explore" } : undefined}
    />
  ) : (
    <div className={GRID_CLASSES}>
      {items.map((item, index) => (
        <ListItemCard
          key={item.uuid}
          item={item}
          position={ranked ? index + 1 : null}
          onRemove={onRemove}
          isRemoving={isRemoving}
          onMove={ranked ? onMove : undefined}
          isMoving={isMoving}
          first={index === 0}
          last={index === items.length - 1}
        />
      ))}
    </div>
  );

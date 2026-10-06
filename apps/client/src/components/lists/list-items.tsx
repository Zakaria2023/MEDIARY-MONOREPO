import { ListItem } from "services";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { GRID_CLASSES } from "@/components/catalog/title-grid";
import { ListItemCard } from "@/components/lists/list-item-card";

type ListItemsProps = {
  items: ListItem[];
  /** The owner's remove, when the viewer owns the list. */
  onRemove?: (mediaUuid: string) => void;
  isRemoving?: boolean;
};

/** The titles on a list, in the owner's order, or a sentence for an empty one. */
export const ListItems = ({ items, onRemove, isRemoving = false }: ListItemsProps) =>
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
          position={index + 1}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      ))}
    </div>
  );

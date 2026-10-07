import { ListSummary } from "services";
import { ListCard } from "@/components/lists/list-card";

type ListGridProps = {
  lists: ListSummary[];
  showOwner?: boolean;
  pinnable?: boolean;
};

/** Two across on a phone, five on a wide desktop. */
export const ListGrid = ({ lists, showOwner = false, pinnable = false }: ListGridProps) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5">
    {lists.map((list) => (
      <ListCard key={list.uuid} list={list} showOwner={showOwner} pinnable={pinnable} />
    ))}
  </div>
);

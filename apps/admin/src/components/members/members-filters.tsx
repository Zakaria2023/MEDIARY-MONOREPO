import { Search } from "lucide-react";
import { Input } from "ui";

type MembersFiltersProps = {
  query: string;
};

/** The search box, a plain GET form so every search has its own URL. */
export const MembersFilters = ({ query }: MembersFiltersProps) => (
  <form action="/members" method="get" className="sm:w-80">
    <Input
      name="q"
      type="search"
      defaultValue={query}
      placeholder="Search by handle, name or email"
      aria-label="Search members"
      icon={<Search size={16} />}
    />
  </form>
);

import { EMPTY_VALUE } from "utils";

type Fact = {
  label: string;
  value: string | number | null | undefined;
};

type FactListProps = {
  facts: Fact[];
};

/** Label and value pairs in a grid; a missing value reads as a dash. */
export const FactList = ({ facts }: FactListProps) => (
  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
    {facts.map((fact) => (
      <div key={fact.label} className="flex flex-col gap-0.5">
        <dt className="text-xs font-medium uppercase tracking-wide text-faint">{fact.label}</dt>
        <dd className="text-sm text-ink">
          {fact.value === null || fact.value === undefined || fact.value === ""
            ? EMPTY_VALUE
            : fact.value}
        </dd>
      </div>
    ))}
  </dl>
);

import { MetricShare } from "services";

const FORMAT = new Intl.NumberFormat("en-US");

/** A share as a percent, or a dash while nobody qualifies yet: 0% of nobody is not a result. */
export const formatSharePercent = ({ cohort, hit }: MetricShare): string =>
  cohort === 0 ? "—" : `${Math.round((hit / cohort) * 100)}%`;

/** What the percent rests on: "3 of 40", or why there is none yet. */
export const formatShareBase = ({ cohort, hit }: MetricShare, nobody: string): string =>
  cohort === 0 ? nobody : `${FORMAT.format(hit)} of ${FORMAT.format(cohort)}`;

/** A count with thousands separators. */
export const formatCount = (value: number): string => FORMAT.format(value);

/** A rate per active member, one decimal, or a dash with no one active. */
export const formatPerMember = (total: number, members: number): string =>
  members === 0 ? "—" : (Math.round((total / members) * 10) / 10).toFixed(1);

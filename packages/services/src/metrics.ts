import { sql } from "drizzle-orm";
import { db } from "../../../db";

/** A share: how many qualified, and how many of those did the thing. */
export type MetricShare = {
  cohort: number;
  hit: number;
};

/** One day of the retention curve: of the members old enough, how many came back that day or later. */
export type RetentionPoint = MetricShare & {
  day: number;
};

/** What the admin's Metrics screen reads: the launch roadmap's measures, from the tables themselves. */
export type ProductMetrics = {
  members: number;
  joinedLast30: number;
  activeLast7: number;
  activeLast30: number;
  /** Joined 7 to 90 days ago, and tracks at least ACTIVATION_TITLES titles. */
  activation: MetricShare;
  retention: RetentionPoint[];
  titlesAddedLast30: number;
  progressUpdatesLast30: number;
  reviewsLast30: number;
  followsLast30: number;
  /** Imports previewed in the last 90 days, and how many of those were applied. */
  imports: MetricShare;
};

/** The one row the metrics query returns. */
type MetricsRow = {
  members: number;
  joined30: number;
  active7: number;
  active30: number;
  activation_cohort: number;
  activated: number;
  d1_cohort: number;
  d1_returned: number;
  d7_cohort: number;
  d7_returned: number;
  d30_cohort: number;
  d30_returned: number;
  titles30: number;
  progress30: number;
  reviews30: number;
  follows30: number;
  imports_started: number;
  imports_applied: number;
};

/** The roadmap's activation bar: a new member who tracks this many titles has found the product. */
export const ACTIVATION_TITLES = 5;

/** Members old enough for day N, and those of them with any activity N days or more after joining. */
const retentionColumns = (day: number) => sql`
  (select count(*) from members m where m.created_at between now() - interval '180 days' and now() - make_interval(days => ${day}))::int as ${sql.raw(`d${day}_cohort`)},
  (select count(*) from members m where m.created_at between now() - interval '180 days' and now() - make_interval(days => ${day})
    and exists (select 1 from activity a where a.user_uuid = m.uuid and a.created_at >= m.created_at + make_interval(days => ${day})))::int as ${sql.raw(`d${day}_returned`)}`;

/**
 * THE LAUNCH MEASURES, computed from the tables in one query rather than
 * counted from events: activation (a new member tracking five titles),
 * retention on day 1, 7 and 30 (any progress or review that many days or
 * more after joining), how active the active are, and how imports end.
 * Activity is a progress event or a review, the two things a member does
 * that leave a dated row. Active accounts only; nothing here names anyone.
 */
export const getProductMetrics = async (): Promise<ProductMetrics> => {
  const result = await db.execute<MetricsRow>(sql`
    with members as (
      select uuid, created_at from "Users" where status = 'active'
    ),
    activity as (
      select user_uuid, created_at from "ProgressEvents"
      union all
      select user_uuid, created_at from "Reviews"
    )
    select
      (select count(*) from members)::int as members,
      (select count(*) from members where created_at >= now() - interval '30 days')::int as joined30,
      (select count(distinct user_uuid) from activity where created_at >= now() - interval '7 days')::int as active7,
      (select count(distinct user_uuid) from activity where created_at >= now() - interval '30 days')::int as active30,
      (select count(*) from members where created_at between now() - interval '90 days' and now() - interval '7 days')::int as activation_cohort,
      (select count(*) from members m where m.created_at between now() - interval '90 days' and now() - interval '7 days'
        and (select count(*) from "UserMedia" um where um.user_uuid = m.uuid) >= ${ACTIVATION_TITLES})::int as activated,
      ${retentionColumns(1)},
      ${retentionColumns(7)},
      ${retentionColumns(30)},
      (select count(*) from "UserMedia" where created_at >= now() - interval '30 days')::int as titles30,
      (select count(*) from "ProgressEvents" where created_at >= now() - interval '30 days')::int as progress30,
      (select count(*) from "Reviews" where created_at >= now() - interval '30 days')::int as reviews30,
      (select count(*) from "Follows" where created_at >= now() - interval '30 days')::int as follows30,
      (select count(*) from "Imports" where created_at >= now() - interval '90 days')::int as imports_started,
      (select count(*) from "Imports" where created_at >= now() - interval '90 days' and status = 'applied')::int as imports_applied
  `);
  const row = result.rows[0];
  if (!row) {
    throw new Error("The metrics query returned nothing");
  }
  return {
    members: row.members,
    joinedLast30: row.joined30,
    activeLast7: row.active7,
    activeLast30: row.active30,
    activation: { cohort: row.activation_cohort, hit: row.activated },
    retention: [
      { day: 1, cohort: row.d1_cohort, hit: row.d1_returned },
      { day: 7, cohort: row.d7_cohort, hit: row.d7_returned },
      { day: 30, cohort: row.d30_cohort, hit: row.d30_returned },
    ],
    titlesAddedLast30: row.titles30,
    progressUpdatesLast30: row.progress30,
    reviewsLast30: row.reviews30,
    followsLast30: row.follows30,
    imports: { cohort: row.imports_started, hit: row.imports_applied },
  };
};

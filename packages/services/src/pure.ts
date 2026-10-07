// THE BROWSER-SAFE DOOR INTO THIS PACKAGE.
//
// `services` is a server package: every service module imports `db`. A client
// component that imports a VALUE from "services" therefore fails the build,
// with a stack pointing at the database connection rather than at the
// function it wanted.
//
// A rule that takes rows and returns rows, touching no database, may be
// re-exported here, and a client component imports it from "services/pure".
//
// TYPES ARE NOT THE PROBLEM. `import type { AuthUser } from "services"` is
// erased before anything runs and can stay pointed at the main barrel.
//
// NOTHING THAT IMPORTS `db` MAY BE ADDED HERE. pure.test.ts walks the import
// graph and fails if one ever is.

export { ValidationError, NotFoundError } from "./errors";

export { computeMilestones } from "./milestone-rules";
export type { Milestone, MilestoneMeasure, MilestoneSummary } from "./milestone-rules";

export { STAFF_ROLES, isStaffRole, isAdminRole } from "./roles";
export type { StaffRole } from "./roles";

export {
  applyTick,
  clampProgress,
  entryChange,
  NO_LIMITS,
  progressCap,
  progressLimitsFor,
  settleEntry,
  todayIn,
} from "./tracking-rules";
export type { EntryChange, EntryState, ProgressLimits } from "./tracking-rules";

export { canView } from "./visibility";
export type { ViewerRelation } from "./visibility";

export { diaryKind } from "./diary-rules";
export type { DiaryKind, DiaryEventFields } from "./diary-rules";

export { parseStatusWord, MAX_IMPORT_ITEMS } from "./import-parsers";
export type { ParsedImportItem } from "./import-parsers";

export { computeTasteMatch, computeTasteTraits, LOVED_SCORE, TASTE_TRAIT_LIMIT } from "./taste-rules";
export type { MediumMatch, TasteEntry, TasteMatch, TasteTrait } from "./taste-rules";

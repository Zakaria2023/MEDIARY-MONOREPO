import { pgEnum } from "drizzle-orm/pg-core";
import {
  activityKinds,
  animeFormats,
  favoriteKinds,
  imageTypes,
  importOutcomes,
  importSources,
  importStatuses,
  mediaStatuses,
  mediaTypes,
  progressUnits,
  providers,
  releaseTypes,
  reportReasons,
  reportStatuses,
  seasons,
  tagCategories,
  tasteComparisonSettings,
  titleTypes,
  trackingStatuses,
  userRoles,
  userStatuses,
  visibilities,
} from "../enum";

// THE POSTGRES ENUM TYPES, one per const array in db/enum.ts. They are
// declared here and nowhere else because drizzle-kit creates a type only when
// it sees it exported from the schema, and because a column in two tables
// naming the same type must share one declaration or push will try to create
// it twice.
//
// WIDENING ONE IS A SCHEMA CHANGE LIKE ANY OTHER: add the value to the array in
// enum.ts and `pnpm db:push` adds it to the type. Postgres can add a value to
// an enum in place; it cannot remove one, so a value is never deleted from
// these arrays, only retired from the labels.

export const userRoleEnum = pgEnum("user_role", userRoles);
export const userStatusEnum = pgEnum("user_status", userStatuses);
export const visibilityEnum = pgEnum("visibility", visibilities);
export const tasteComparisonEnum = pgEnum(
  "taste_comparison",
  tasteComparisonSettings,
);

export const mediaTypeEnum = pgEnum("media_type", mediaTypes);
export const mediaStatusEnum = pgEnum("media_status", mediaStatuses);
export const titleTypeEnum = pgEnum("title_type", titleTypes);
export const imageTypeEnum = pgEnum("image_type", imageTypes);
export const providerEnum = pgEnum("provider", providers);
export const animeFormatEnum = pgEnum("anime_format", animeFormats);
export const seasonEnum = pgEnum("season", seasons);
export const releaseTypeEnum = pgEnum("release_type", releaseTypes);
export const tagCategoryEnum = pgEnum("tag_category", tagCategories);

export const trackingStatusEnum = pgEnum("tracking_status", trackingStatuses);
export const progressUnitEnum = pgEnum("progress_unit", progressUnits);
export const favoriteKindEnum = pgEnum("favorite_kind", favoriteKinds);

export const activityKindEnum = pgEnum("activity_kind", activityKinds);

export const importSourceEnum = pgEnum("import_source", importSources);
export const importStatusEnum = pgEnum("import_status", importStatuses);
export const importOutcomeEnum = pgEnum("import_outcome", importOutcomes);

export const reportReasonEnum = pgEnum("report_reason", reportReasons);
export const reportStatusEnum = pgEnum("report_status", reportStatuses);

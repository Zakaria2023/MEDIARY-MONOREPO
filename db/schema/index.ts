// The schema barrel. Every table file under db/schema/ is re-exported here,
// and this is the one path drizzle.config.ts and db/index.ts read it from.
export * from "./enums";
export * from "./users";
export * from "./profiles";
export * from "./user-settings";
export * from "./blocks";
export * from "./media";
export * from "./media-titles";
export * from "./media-external-refs";
export * from "./media-images";
export * from "./genres";
export * from "./tags";
export * from "./platforms";
export * from "./media-details";
export * from "./user-media";
export * from "./progress-events";
export * from "./favorites";

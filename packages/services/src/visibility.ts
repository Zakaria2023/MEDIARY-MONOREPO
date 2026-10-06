// A type-only import, so services/pure can re-export this (pure.test.ts).
import type { Visibility } from "../../../db/enum";

/** Who is looking, relative to the profile's owner. */
export type ViewerRelation = "owner" | "follower" | "stranger";

/**
 * WHETHER A VIEWER MAY SEE SOMETHING SET TO A VISIBILITY. The owner always
 * may; a follower may see what is for followers; a stranger sees only what
 * is public. Enforced in the queries that read the data, never only by
 * hiding a section (CLAUDE.md, Auth Checks).
 */
export const canView = (visibility: Visibility, relation: ViewerRelation): boolean => {
  if (relation === "owner") {
    return true;
  }
  if (visibility === "public") {
    return true;
  }
  return visibility === "followers" && relation === "follower";
};

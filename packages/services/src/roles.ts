/**
 * The roles that may open the admin app. `moderator` handles reports and
 * corrections; `admin` also runs imports and changes roles. Both are values
 * of the role column on Mediary's Users table, never Clerk metadata, so a
 * role change takes effect on the next request without a session refresh.
 *
 * Plain strings rather than the `UserRole` type from db/enum: this module is
 * re-exported through `services/pure` for client components, and the guard
 * in pure.test.ts refuses any import from the db folder on that path. The
 * values must stay in step with `userRoles` in db/enum.ts.
 */
export const STAFF_ROLES = ["admin", "moderator"] as const satisfies readonly string[];

export type StaffRole = (typeof STAFF_ROLES)[number];

export const isStaffRole = (role: string): role is StaffRole =>
  (STAFF_ROLES as readonly string[]).includes(role);

export const isAdminRole = (role: string): boolean => role === "admin";

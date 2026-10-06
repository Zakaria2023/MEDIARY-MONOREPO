import { eq, sql } from "drizzle-orm";
import { isValidUsername, suggestUsername, UNNAMED_USER } from "utils";
import { db } from "../../../db";
import { Profiles } from "../../../db/schema/profiles";
import { UserSettings } from "../../../db/schema/user-settings";
import { InsertUsers, SelectUsers, Users } from "../../../db/schema/users";
import { isUniqueViolation } from "./db-result";
import { ValidationError } from "./errors";

/**
 * The signed-in user. Identity (email, verification, sessions) is owned by
 * Clerk; this row is the profile store, kept in sync by the Clerk webhook.
 * The web app resolves the caller to one of these via `getUserByClerkId`.
 */
export type AuthUser = SelectUsers;

/**
 * Everything a Clerk `user.created` / `user.updated` event carries that
 * Mediary mirrors. Nothing else: the username, the bio and every setting are
 * Mediary's own and a Clerk event never touches them.
 */
export type ClerkUserSync = {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

/** Looks up a user by Mediary's own uuid. */
export const getUserByUuid = async (uuid: string): Promise<AuthUser | null> => {
  const [user] = await db.select().from(Users).where(eq(Users.uuid, uuid));
  return user ?? null;
};

/**
 * Resolves the profile row behind a Clerk user id. This is the single lookup
 * the app uses after Clerk has verified the caller. Returns null when no
 * synced row exists yet, which the app handles by syncing on demand.
 */
export const getUserByClerkId = async (
  clerkUserId: string,
): Promise<AuthUser | null> => {
  const [user] = await db
    .select()
    .from(Users)
    .where(eq(Users.clerkUserId, clerkUserId));
  return user ?? null;
};

/** The public profile's owner, by handle. Case-insensitive, like the index. */
export const getUserByUsername = async (
  username: string,
): Promise<AuthUser | null> => {
  const [user] = await db
    .select()
    .from(Users)
    .where(sql`lower(${Users.username}) = ${username.toLowerCase()}`);
  return user ?? null;
};

const composeDisplayName = (input: ClerkUserSync): string =>
  [input.firstName, input.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim() || UNNAMED_USER;

/**
 * Upserts a profile row from a Clerk event, keyed by the Clerk user id, and
 * creates the Profiles and UserSettings rows beside a new account so no
 * later read has to cope with their absence.
 *
 * On update only identity-derived fields are refreshed. A NAME CLERK DOES NOT
 * HAVE DOES NOT ERASE ONE WE DO: an account created with an email alone has
 * no name in Clerk and gives it to Mediary on the welcome screen; the next
 * Clerk event must not write the sentinel back over it.
 */
export const syncClerkUser = async (input: ClerkUserSync): Promise<AuthUser> => {
  const existing = await getUserByClerkId(input.clerkUserId);
  const composed = composeDisplayName(input);

  if (existing) {
    const values = {
      email: input.email,
      imageUrl: input.imageUrl,
      displayName:
        composed !== UNNAMED_USER || existing.displayName === UNNAMED_USER
          ? composed
          : existing.displayName,
    } satisfies Partial<InsertUsers>;

    const [updated] = await db
      .update(Users)
      .set(values)
      .where(eq(Users.id, existing.id))
      .returning();
    if (!updated) {
      throw new Error("Failed to update synced user");
    }
    return updated;
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(Users)
      .values({
        clerkUserId: input.clerkUserId,
        email: input.email,
        imageUrl: input.imageUrl,
        displayName: composed,
      })
      .returning();
    if (!created) {
      throw new Error("Failed to create synced user");
    }
    await tx.insert(Profiles).values({ userUuid: created.uuid });
    await tx.insert(UserSettings).values({ userUuid: created.uuid });
    return created;
  });
};

/**
 * Removes the account when Clerk reports the user deleted. Every table that
 * belongs to a user cascades from Users.uuid, so this is one statement.
 */
export const deleteClerkUser = async (clerkUserId: string): Promise<void> => {
  await db.delete(Users).where(eq(Users.clerkUserId, clerkUserId));
};

/**
 * Whether a handle is free. Case-insensitive, like the index that enforces
 * it. A handle held by `exceptUserUuid` counts as free: the person asking
 * already has it, and their own row must never tell them it is taken.
 */
export const isUsernameAvailable = async (
  username: string,
  exceptUserUuid?: string,
): Promise<boolean> => {
  const taken = await getUserByUsername(username);
  return taken === null || taken.uuid === exceptUserUuid;
};

/**
 * The welcome screen: a new account picks its handle and confirms its name.
 * The UNIQUE index is the guarantee against two people choosing the same
 * handle at once; the availability read above is only there to say so
 * politely before the form is submitted.
 */
export const completeWelcome = async (
  userUuid: string,
  input: { username: string; displayName: string },
): Promise<AuthUser> => {
  const username = input.username.trim().toLowerCase();
  if (!isValidUsername(username)) {
    throw new ValidationError(
      "A username is 3 to 30 characters: letters, numbers and underscores.",
    );
  }

  try {
    const [updated] = await db
      .update(Users)
      .set({ username, displayName: input.displayName.trim() })
      .where(eq(Users.uuid, userUuid))
      .returning();
    if (!updated) {
      throw new Error("Failed to complete welcome");
    }
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ValidationError("That username is taken. Try another.");
    }
    throw error;
  }
};

/**
 * A free handle to offer the welcome screen, from the email or the name.
 * Tries the plain suggestion first and then a few numbered variants; gives
 * up with the plain one if all are taken, and the form will say so.
 */
export const suggestAvailableUsername = async (
  seed: string,
): Promise<string> => {
  const base = suggestUsername(seed);
  const candidates = [base, ...[2, 3, 4, 5].map((n) => `${base.slice(0, 28)}_${n}`)];
  for (const candidate of candidates) {
    if (await isUsernameAvailable(candidate)) {
      return candidate;
    }
  }
  return base;
};

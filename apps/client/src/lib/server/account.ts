import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

/** What the account panel shows about how a person signs in. */
export type AccountSummary = {
  email: string | null;
  hasPassword: boolean;
  /** The Google address the account is linked to, if it signs in with Google. */
  googleEmail: string | null;
};

// THE IDENTITY SERVICE'S SERVER API, for the three account operations that
// are about credentials rather than Mediary's own data. Server-side on
// purpose: the browser API asks for re-verification through a dialog the
// service draws itself, and nothing the service draws is shown in Mediary.

/** How this account signs in, for the account panel. */
export const getAccountSummary = async (identityId: string): Promise<AccountSummary> => {
  const client = await clerkClient();
  const user = await client.users.getUser(identityId);
  const google = user.externalAccounts.find((account) => account.provider.includes("google"));
  return {
    email: user.primaryEmailAddress?.emailAddress ?? null,
    hasPassword: user.passwordEnabled,
    googleEmail: google?.emailAddress ?? null,
  };
};

/**
 * Sets a new password after checking the current one, where there is one,
 * and signs every other device out.
 */
export const changeAccountPassword = async (
  identityId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const client = await clerkClient();
  const user = await client.users.getUser(identityId);
  if (user.passwordEnabled) {
    await client.users.verifyPassword({ userId: identityId, password: currentPassword });
  }
  await client.users.updateUser(identityId, {
    password: newPassword,
    signOutOfOtherSessions: true,
  });
};

/** Deletes the identity: sign-in methods, sessions, everything the service holds. */
export const deleteAccountIdentity = async (identityId: string): Promise<void> => {
  const client = await clerkClient();
  await client.users.deleteUser(identityId);
};

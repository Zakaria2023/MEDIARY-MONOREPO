import { buildClerkUserSync } from "@/lib/clerk-user";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { AuthUser, getUserByClerkId, syncClerkUser } from "services";

/**
 * Resolves the signed-in user, or null when there is no valid session. Clerk
 * verifies the session cookie for us (via proxy.ts); we then map its
 * `userId` to our profile row.
 *
 * If the user is signed in but has no profile row yet (the webhook has not
 * landed, or a social sign-up just completed), it is synced on demand from
 * Clerk so the app never treats a signed-in user as missing. Request-scoped
 * via React `cache` so multiple callers in one render share the result.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const existing = await getUserByClerkId(userId);
  if (existing) {
    return existing;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  return syncClerkUser(
    buildClerkUserSync({
      clerkUserId: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses.map((entry) => ({
        id: entry.id,
        emailAddress: entry.emailAddress,
      })),
      primaryEmailAddressId: clerkUser.primaryEmailAddressId,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    }),
  );
});

/**
 * A signed-in user, or a redirect to sign-in. For a layout that fronts a
 * private section; a page never calls it (see CLAUDE.md, Auth Checks).
 */
export const requireUser = async (): Promise<AuthUser> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
};

/**
 * A signed-in user who has finished the welcome screen. The product's
 * private pages need a username (every share link and profile URL carries
 * it), so a new account is sent to pick one before it sees anything else.
 */
export const requireOnboardedUser = async (): Promise<AuthUser> => {
  const user = await requireUser();
  if (!user.username) {
    redirect("/welcome");
  }
  return user;
};

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  AuthUser,
  buildClerkUserSync,
  getUserByClerkId,
  isAdminRole,
  isStaffRole,
  syncClerkUser,
} from "services";

/**
 * The signed-in user, or null. The same resolution as the client app: Clerk
 * verifies the session in proxy.ts, the id maps to Mediary's Users row, and
 * a row the webhook has not created yet is synced on demand. Cached for the
 * request so the layout gate and a page's own reads share one lookup.
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
 * THE ROLE GATE. One Clerk instance backs both apps, so every member holds a
 * session this app would otherwise accept; the role on Mediary's own Users
 * row is what admits them. A wrong-role session goes to /no-access rather
 * than /sign-in: it is already signed in, and a sign-in screen would loop.
 *
 * The dashboard layout calls this for every screen, and every Server Action
 * calls it again for every write, so data paths are gated on their own.
 */
export const requireStaff = cache(async (): Promise<AuthUser> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (!isStaffRole(user.role) || user.status !== "active") {
    redirect("/no-access");
  }
  return user;
});

/** The stricter gate for imports, role changes and deletions. */
export const requireAdmin = async (): Promise<AuthUser> => {
  const user = await requireStaff();
  if (!isAdminRole(user.role)) {
    redirect("/no-access");
  }
  return user;
};

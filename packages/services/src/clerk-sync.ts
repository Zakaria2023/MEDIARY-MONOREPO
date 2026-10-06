import { ClerkUserSync } from "./auth";

type ClerkEmail = {
  id: string;
  emailAddress: string;
};

type BuildClerkUserSyncInput = {
  clerkUserId: string;
  emailAddresses: ClerkEmail[];
  primaryEmailAddressId: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

/**
 * Maps a Clerk user's identity into the shape the profile sync expects.
 * Shared by the webhook (raw event, after it has reshaped the snake_case
 * payload) and getCurrentUser (Clerk resource) so both produce identical rows.
 */
export const buildClerkUserSync = ({
  clerkUserId,
  emailAddresses,
  primaryEmailAddressId,
  firstName,
  lastName,
  imageUrl,
}: BuildClerkUserSyncInput): ClerkUserSync => {
  const primary =
    emailAddresses.find((entry) => entry.id === primaryEmailAddressId) ??
    emailAddresses[0];

  return {
    clerkUserId,
    email: primary?.emailAddress ?? null,
    firstName: firstName || null,
    lastName: lastName || null,
    imageUrl: imageUrl || null,
  };
};

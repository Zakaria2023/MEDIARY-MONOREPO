import "server-only";
import { AuthUser, getPublicProfile, ProfileAccess, PublicProfile } from "services";
import { getUserFromRequest } from "./request-user";
import { notFound } from "./respond";

/** The profile and the caller, when the caller may see the part asked for; else the response that says not. */
type ProfileGate =
  | { profile: PublicProfile; viewer: AuthUser | null; response: null }
  | { profile: null; viewer: null; response: Response };

/**
 * A PROFILE SECTION'S GATE, before its data is read: the profile by handle
 * with the caller's relation to it, then the owner's setting for the part
 * asked for. A section the caller may not see is answered 404 without being
 * fetched, and a block in either direction reads as no such profile.
 */
export const gateProfile = async (
  request: Request,
  username: string,
  part: keyof ProfileAccess,
): Promise<ProfileGate> => {
  const viewer = await getUserFromRequest(request);
  const profile = await getPublicProfile(decodeURIComponent(username), viewer?.uuid ?? null);
  if (!profile || !profile.access[part]) {
    return { profile: null, viewer: null, response: notFound("Nothing to show here") };
  }
  return { profile, viewer, response: null };
};

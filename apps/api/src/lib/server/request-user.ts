import "server-only";
import { createClerkClient, verifyToken } from "@clerk/backend";
import {
  AuthUser,
  buildClerkUserSync,
  getUserByClerkId,
  syncClerkUser,
} from "services";
import { forbidden, unauthorized } from "./respond";

/** A member who may use the private API, or the response that says why not. */
type MemberResult =
  | { user: AuthUser; response: null }
  | { user: null; response: Response };

/** The secret key, or a loud failure: the API cannot verify anyone without it. */
const clerkSecretKey = (): string => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing required environment variable: CLERK_SECRET_KEY");
  }
  return secretKey;
};

/** The bearer token on a request, or null when there is none. */
const bearerToken = (request: Request): string | null => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
};

/**
 * The profile row behind a verified identity, synced from the identity
 * service on the spot when the webhook has not landed yet: a member who has
 * just signed up on the phone must not be told they do not exist. The same
 * repair `getCurrentUser` makes on the web.
 */
const resolveUser = async (clerkUserId: string): Promise<AuthUser | null> => {
  const existing = await getUserByClerkId(clerkUserId);
  if (existing) {
    return existing;
  }
  const clerk = createClerkClient({ secretKey: clerkSecretKey() });
  const clerkUser = await clerk.users.getUser(clerkUserId);
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
};

/**
 * THE CALLER, FROM THEIR BEARER TOKEN. The mobile app signs in with the
 * identity service itself and sends the session token it was given; it is
 * verified here (networkless when `CLERK_JWT_KEY` is set, against the
 * service's cached keys otherwise) and its subject mapped to the profile
 * row. Null for no token, a bad one or an expired one: a public route
 * answers a stranger, a private one sends a 401.
 */
export const getUserFromRequest = async (request: Request): Promise<AuthUser | null> => {
  const token = bearerToken(request);
  if (!token) {
    return null;
  }
  let subject: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: clerkSecretKey(),
      jwtKey: process.env.CLERK_JWT_KEY || undefined,
    });
    subject = payload.sub;
  } catch {
    return null;
  }
  return resolveUser(subject);
};

/**
 * A signed-in, active member who has chosen a username: what every private
 * route needs, as `requireOnboardedUser` is on the web. A new account gets
 * a 403 with `code: "onboarding"`, which the app reads as "show the
 * welcome screen", never as a failure.
 */
export const requireMember = async (request: Request): Promise<MemberResult> => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { user: null, response: unauthorized() };
  }
  if (user.status !== "active") {
    return { user: null, response: forbidden("This account is not active", "inactive") };
  }
  if (!user.username) {
    return { user: null, response: forbidden("Choose a username first", "onboarding") };
  }
  return { user, response: null };
};

/**
 * A signed-in, active account, onboarded or not: the welcome screen's own
 * routes, which exist to give a new account its username.
 */
export const requireAccount = async (request: Request): Promise<MemberResult> => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { user: null, response: unauthorized() };
  }
  if (user.status !== "active") {
    return { user: null, response: forbidden("This account is not active", "inactive") };
  }
  return { user, response: null };
};

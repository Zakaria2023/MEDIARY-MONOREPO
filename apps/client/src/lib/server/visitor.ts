import { headers } from "next/headers";
import { checkRateLimit } from "rate-limit";
import { deviceKindOf, isAutomatedAgent } from "services";
import { DeviceKind } from "@/db/enum";

/** Who is asking, as far as counting a click or a view needs to know. */
export type Visitor = {
  /** The member's uuid, or the address, for the rate limit only; never stored. */
  identity: string;
  device: DeviceKind;
  /** A crawler, a script or a preview fetch: nothing it does is counted. */
  automated: boolean;
};

/** A visitor from a request's headers, with the member's uuid when signed in. */
export const visitorFrom = (requestHeaders: Headers, userUuid: string | null): Visitor => {
  const userAgent = requestHeaders.get("user-agent");
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    identity: userUuid ? `user:${userUuid}` : `ip:${address || "unknown"}`,
    device: deviceKindOf(userAgent),
    automated: isAutomatedAgent(userAgent),
  };
};

/** The visitor behind the Server Action or page being run. */
export const currentVisitor = async (userUuid: string | null): Promise<Visitor> => visitorFrom(await headers(), userUuid);

/**
 * WHETHER TO COUNT THIS ONE. A program is never counted; a person is, up to
 * `limit` times in `windowMs` for one bucket, so a burst of presses from one
 * address, or one visitor reloading a page, adds one and not fifty. The
 * address is held in memory for the window and never written anywhere.
 */
export const shouldCount = async (visitor: Visitor, bucket: string, limit: number, windowMs: number): Promise<boolean> => {
  if (visitor.automated) {
    return false;
  }
  const decision = await checkRateLimit(visitor.identity, { bucket, limit, windowMs });
  return decision.allowed;
};

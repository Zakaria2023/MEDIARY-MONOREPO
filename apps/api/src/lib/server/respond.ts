import "server-only";
import { NextResponse } from "next/server";
import { fail } from "utils";
import { z } from "zod";

/** Why a 403 was sent, for the app to branch on; the message is for a person. */
type ForbiddenCode = "onboarding" | "inactive";

/**
 * THE STATUS FOR A THROWN ERROR, by the error's name because the classes
 * live in services and this file would rather not care which module threw:
 * a service's ValidationError is the caller's mistake (400), a NotFoundError
 * a missing or someone else's thing (404), a catalog source that failed is
 * the gateway's (502). Anything else is ours (500).
 */
const STATUS_BY_ERROR: Record<string, number> = {
  ValidationError: 400,
  NotFoundError: 404,
  ProviderError: 502,
};

/*
 * EVERY ERROR THE API SENDS IS `{ error: string }`, sometimes with `code`
 * (for the app to branch on) or `fields` (a form's field errors). Success is
 * the service's result as it is, with no envelope: the mobile app's types are
 * the service's own types.
 */

export const unauthorized = (): Response =>
  NextResponse.json({ error: "Sign in to do that" }, { status: 401 });

export const forbidden = (message: string, code: ForbiddenCode): Response =>
  NextResponse.json({ error: message, code }, { status: 403 });

export const notFound = (message = "Not found"): Response =>
  NextResponse.json({ error: message }, { status: 404 });

/** A body or a query that did not pass its schema: the first problem in words, every field's problems beside it. */
export const invalid = (error: z.ZodError): Response =>
  NextResponse.json(
    {
      error: error.issues[0]?.message ?? "Check the request",
      fields: z.flattenError(error).fieldErrors,
    },
    { status: 400 },
  );

/**
 * A caught error as a response. The message is `fail`'s, the same rule a
 * Server Action follows: what a service wrote for a person passes, anything
 * else becomes the route's own fallback, and a database error never reaches
 * the phone. An unexpected one is logged, because the catch hides it from
 * `onRequestError`.
 */
export const failure = (error: unknown, fallback: string): Response => {
  const name = error instanceof Error ? error.name : "";
  const status = STATUS_BY_ERROR[name] ?? 500;
  if (status === 500) {
    console.error(
      JSON.stringify({
        level: "error",
        message: error instanceof Error ? error.message : String(error),
        fallback,
      }),
    );
  }
  return NextResponse.json(fail(error, fallback), { status });
};

/** A JSON body, or null when there is none or it does not parse; the schema then refuses it. */
export const readBody = async (request: Request): Promise<unknown> =>
  request.json().catch(() => null);

/** The query string's values as one plain object, the first of any repeated name. */
export const queryOf = (request: Request): Record<string, string> =>
  Object.fromEntries(new URL(request.url).searchParams);

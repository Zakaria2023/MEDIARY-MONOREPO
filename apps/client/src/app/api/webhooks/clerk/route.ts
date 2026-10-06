import { buildClerkUserSync } from "@/lib/clerk-user";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { deleteClerkUser, syncClerkUser } from "services";
import { Webhook } from "svix";

// Clerk is the source of truth for identity; this webhook mirrors its users
// into the Users table so the rest of the app can keep joining on Users.uuid.
// It is a Route Handler (not a Server Action) by necessity: it is called by
// an external service, needs the raw request body for signature verification,
// and is excluded from Clerk middleware in proxy.ts so that body arrives
// untouched.

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
};

type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserData;
};

export const POST = async (request: Request) => {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "Missing required environment variable: CLERK_WEBHOOK_SIGNING_SECRET",
    );
  }

  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await request.text();

  let event: ClerkWebhookEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    await syncClerkUser(
      buildClerkUserSync({
        clerkUserId: event.data.id,
        emailAddresses: (event.data.email_addresses ?? []).map((entry) => ({
          id: entry.id,
          emailAddress: entry.email_address,
        })),
        primaryEmailAddressId: event.data.primary_email_address_id ?? null,
        firstName: event.data.first_name ?? null,
        lastName: event.data.last_name ?? null,
        imageUrl: event.data.image_url ?? null,
      }),
    );
  }

  if (event.type === "user.deleted") {
    await deleteClerkUser(event.data.id);
  }

  return new NextResponse(null, { status: 204 });
};

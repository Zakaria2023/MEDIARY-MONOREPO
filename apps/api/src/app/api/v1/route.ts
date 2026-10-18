import { NextResponse } from "next/server";

/** The version this API answers, for a client that wants to check before it asks anything else. */
export const GET = () => NextResponse.json({ name: "mediary", version: "v1" });

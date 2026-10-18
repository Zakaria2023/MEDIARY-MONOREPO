import { NextResponse } from "next/server";
import { getFeatureFlags } from "services";

/**
 * Which features are on. The app reads it only to hide what the server
 * would refuse; every service still checks its own flag.
 */
export const GET = () => NextResponse.json(getFeatureFlags());

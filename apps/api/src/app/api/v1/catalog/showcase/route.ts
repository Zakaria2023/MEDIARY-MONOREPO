import { NextResponse } from "next/server";
import { showcaseQuerySchema } from "validators";
import { listCatalogShowcase } from "@/lib/server/catalog-cache";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** The first few titles of every medium in one answer, keyed by medium: `?sort=&perMedium=`. */
export const GET = async (request: Request) => {
  const parsed = showcaseQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(
      await listCatalogShowcase({ sort: parsed.data.sort, perMedium: parsed.data.perMedium, withCover: true }),
    );
  } catch (error) {
    return failure(error, "Could not load the catalog");
  }
};

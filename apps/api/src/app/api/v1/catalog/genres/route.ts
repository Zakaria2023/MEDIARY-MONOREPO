import { NextResponse } from "next/server";
import { genresQuerySchema } from "validators";
import { listCatalogGenres } from "@/lib/server/catalog-cache";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** The genres with public titles, each with its count: `?type=` for one medium's. */
export const GET = async (request: Request) => {
  const parsed = genresQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  try {
    return NextResponse.json(await listCatalogGenres(parsed.data.type));
  } catch (error) {
    return failure(error, "Could not load the genres");
  }
};

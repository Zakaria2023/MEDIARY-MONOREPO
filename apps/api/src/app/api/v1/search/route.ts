import { NextResponse } from "next/server";
import { searchCatalog } from "services";
import { catalogSearchQuerySchema } from "validators";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** Universal search over every name a title goes by: `?q=&type=&page=&pageSize=`, with each medium's count. */
export const GET = async (request: Request) => {
  const parsed = catalogSearchQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { q, type, page, pageSize } = parsed.data;
  try {
    return NextResponse.json(await searchCatalog({ query: q, mediaType: type, page, pageSize }));
  } catch (error) {
    return failure(error, "Could not search the catalog");
  }
};

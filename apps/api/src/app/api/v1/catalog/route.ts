import { NextResponse } from "next/server";
import { catalogListQuerySchema } from "validators";
import { listCatalog } from "@/lib/server/catalog-cache";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** A discovery grid: `?type=&sort=&genre=&page=&pageSize=`, public titles only. */
export const GET = async (request: Request) => {
  const parsed = catalogListQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { type, sort, genre, page, pageSize } = parsed.data;
  try {
    return NextResponse.json(await listCatalog({ mediaType: type, sort, genre, page, pageSize }));
  } catch (error) {
    return failure(error, "Could not load these titles");
  }
};

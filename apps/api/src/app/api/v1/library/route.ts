import { NextResponse } from "next/server";
import { listLibrary } from "services";
import { libraryQuerySchema } from "validators";
import { requireMember } from "@/lib/server/request-user";
import { failure, invalid, queryOf } from "@/lib/server/respond";

/** One page of the member's library: `?type=&status=&q=&favorites=&minScore=&sort=&page=&pageSize=`. */
export const GET = async (request: Request) => {
  const { user, response } = await requireMember(request);
  if (!user) {
    return response;
  }
  const parsed = libraryQuerySchema.safeParse(queryOf(request));
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { type, status, q, favorites, minScore, sort, page, pageSize } = parsed.data;
  try {
    return NextResponse.json(
      await listLibrary(user.uuid, {
        mediaType: type,
        status,
        search: q,
        favoritesOnly: favorites,
        minScore,
        sort,
        page,
        pageSize,
      }),
    );
  } catch (error) {
    return failure(error, "Could not load your library");
  }
};

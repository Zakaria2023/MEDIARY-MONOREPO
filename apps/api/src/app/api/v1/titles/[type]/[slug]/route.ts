import { NextResponse } from "next/server";
import { catalogFacts, getCatalogTitle } from "services";
import { parseLaunchMediaType } from "validators";
import { failure, notFound } from "@/lib/server/respond";

type Context = {
  params: Promise<{ type: string; slug: string }>;
};

/**
 * A title by its address, the same `/[type]/[slug]` as its web page, with
 * the facts the page lists ("Runtime", "Developer") already in words, so
 * the app and the site cannot label one fact two ways.
 */
export const GET = async (_request: Request, context: Context) => {
  const { type, slug } = await context.params;
  const mediaType = parseLaunchMediaType(type);
  if (!mediaType) {
    return notFound("That title could not be found");
  }
  try {
    const title = await getCatalogTitle(mediaType, decodeURIComponent(slug));
    if (!title) {
      return notFound("That title could not be found");
    }
    return NextResponse.json({ ...title, facts: catalogFacts(title) });
  } catch (error) {
    return failure(error, "Could not load this title");
  }
};

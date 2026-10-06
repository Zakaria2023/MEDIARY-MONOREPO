import { notFound, permanentRedirect } from "next/navigation";
import { parseLaunchMediaType } from "validators";
import { hubPath } from "@/lib/hub-path";

type Props = {
  params: Promise<{ type: string }>;
};

/**
 * A medium's discovery page moved to its own hub, /movies and the rest.
 * The old address stays as a permanent redirect so nothing that linked
 * to it breaks and search engines carry the ranking across.
 */
const ExploreTypePage = async ({ params }: Props) => {
  const mediaType = parseLaunchMediaType((await params).type);
  if (!mediaType) {
    notFound();
  }
  permanentRedirect(hubPath(mediaType));
};

export default ExploreTypePage;

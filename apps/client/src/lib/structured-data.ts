import { CatalogCard, CatalogTitle, ProfileCounts, PublicProfile, RatingSummary, TitleReview } from "services";
import { catalogImageUrl } from "utils";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { profilePath } from "@/lib/profile-path";
import { titlePath } from "@/lib/title-path";

type JsonLdNode = Record<string, unknown> & { "@type": string; "@id"?: string };

/** One step of a breadcrumb trail. */
type Crumb = {
  name: string;
  path: string;
};

/**
 * Site-wide identity in schema.org terms, inherited by every page. Per-page
 * nodes (a Movie, a VideoGame, a ProfilePage) reference these by @id rather
 * than repeating them, so the graph stays one graph.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const organizationNode = (): JsonLdNode => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
});

export const webSiteNode = (): JsonLdNode => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: { "@id": ORGANIZATION_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

/** Wraps nodes in one JSON-LD graph. */
export const graph = (nodes: JsonLdNode[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

/** The poster at a size worth handing a crawler. */
const posterImage = (coverUrl: string | null): string | undefined =>
  coverUrl ? catalogImageUrl(coverUrl, 780) : undefined;

/** The schema.org type a title is: anime is a series unless it is a film. */
const schemaType = (title: CatalogTitle): string => {
  if (title.mediaType === "movie") {
    return "Movie";
  }
  if (title.mediaType === "game") {
    return "VideoGame";
  }
  if (title.mediaType === "music") {
    return "MusicAlbum";
  }
  if (title.mediaType === "book") {
    return "Book";
  }
  if (title.mediaType === "manga") {
    return "ComicSeries";
  }
  if (title.details?.kind === "anime" && title.details.format === "movie") {
    return "Movie";
  }
  return "TVSeries";
};

/** What only the title's medium says about it, in schema.org terms. */
const mediumFields = (title: CatalogTitle): Record<string, unknown> => {
  const { details } = title;
  if (details?.kind === "movie") {
    return {
      ...(details.director && { director: { "@type": "Person", name: details.director } }),
      ...(details.runtime && { duration: `PT${details.runtime}M` }),
      ...(details.certification && { contentRating: details.certification }),
    };
  }
  if (details?.kind === "tv") {
    return {
      ...(details.seasonCount && { numberOfSeasons: details.seasonCount }),
      ...(details.episodeCount && { numberOfEpisodes: details.episodeCount }),
      ...(title.releaseDate && { startDate: title.releaseDate }),
      ...(title.endDate && { endDate: title.endDate }),
    };
  }
  if (details?.kind === "game") {
    return {
      applicationCategory: "Game",
      ...(title.platforms.length > 0 && {
        gamePlatform: title.platforms.map((platform) => platform.name),
      }),
      ...(details.developer && { author: { "@type": "Organization", name: details.developer } }),
      ...(details.publisher && { publisher: { "@type": "Organization", name: details.publisher } }),
      ...(details.multiplayer !== null && {
        playMode: details.multiplayer ? "MultiPlayer" : "SinglePlayer",
      }),
    };
  }
  if (details?.kind === "music") {
    return {
      byArtist: { "@type": "MusicGroup", name: details.artist },
      ...(details.trackCount && { numTracks: details.trackCount }),
      ...(details.durationMinutes && { duration: `PT${details.durationMinutes}M` }),
      ...(details.label && { recordLabel: { "@type": "Organization", name: details.label } }),
    };
  }
  if (details?.kind === "anime") {
    return {
      ...(details.episodeCount && { numberOfEpisodes: details.episodeCount }),
      ...(details.studio && {
        productionCompany: { "@type": "Organization", name: details.studio },
      }),
    };
  }
  return {};
};

/**
 * A title as schema.org sees it: the work itself, on its page, inside the
 * site. Third-party scores are deliberately left out: Google treats a
 * rating a site did not collect from its own users as misleading markup.
 */
export const titleNodes = (title: CatalogTitle, crumbs: Crumb[]): JsonLdNode[] => {
  const url = absoluteUrl(titlePath(title));
  const sameAs = title.refs.flatMap((ref) => (ref.externalUrl ? [ref.externalUrl] : []));
  const breadcrumbId = `${url}#breadcrumb`;

  return [
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: title.canonicalTitle,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": `${url}#title` },
      breadcrumb: { "@id": breadcrumbId },
      ...(title.updatedAt && { dateModified: title.updatedAt.toISOString() }),
    },
    {
      "@type": schemaType(title),
      "@id": `${url}#title`,
      name: title.canonicalTitle,
      url,
      ...(title.description && { description: title.description }),
      ...(posterImage(title.coverUrl) && { image: posterImage(title.coverUrl) }),
      ...(title.releaseDate && { datePublished: title.releaseDate }),
      ...(title.genres.length > 0 && { genre: title.genres.map((genre) => genre.name) }),
      ...(title.titles.length > 1 && {
        alternateName: title.titles
          .filter((entry) => entry.title !== title.canonicalTitle)
          .map((entry) => entry.title),
      }),
      ...(sameAs.length > 0 && { sameAs }),
      ...mediumFields(title),
    },
    breadcrumbNode(breadcrumbId, crumbs),
  ];
};

/** A breadcrumb trail, each step an absolute URL. */
export const breadcrumbNode = (id: string, crumbs: Crumb[]): JsonLdNode => ({
  "@type": "BreadcrumbList",
  "@id": id,
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: absoluteUrl(crumb.path),
  })),
});

/** A page's questions and answers, for the FAQ result in search. */
export const faqNode = (path: string, items: { question: string; answer: string }[]): JsonLdNode => ({
  "@type": "FAQPage",
  "@id": `${absoluteUrl(path)}#faq`,
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

/** The about page, about the organization itself. */
export const aboutNode = (path: string, description: string): JsonLdNode => ({
  "@type": "AboutPage",
  "@id": absoluteUrl(path),
  url: absoluteUrl(path),
  name: `About ${SITE_NAME}`,
  description,
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORGANIZATION_ID },
  mainEntity: { "@id": ORGANIZATION_ID },
});

/** A discovery page's grid, as an ordered list of links to its titles. */
export const itemListNode = (path: string, name: string, cards: CatalogCard[]): JsonLdNode => ({
  "@type": "ItemList",
  "@id": `${absoluteUrl(path)}#list`,
  name,
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  numberOfItems: cards.length,
  itemListElement: cards.map((card, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(titlePath(card)),
    name: card.canonicalTitle,
  })),
});

/** A public profile: the page, and the person it is about. */
export const profileNodes = (profile: PublicProfile, counts: ProfileCounts): JsonLdNode[] => {
  const url = absoluteUrl(profilePath(profile.username));
  const personId = `${url}#person`;

  return [
    {
      "@type": "ProfilePage",
      "@id": url,
      url,
      name: `${profile.displayName} (@${profile.username})`,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": personId },
      dateCreated: profile.joinedAt.toISOString(),
    },
    {
      "@type": "Person",
      "@id": personId,
      name: profile.displayName,
      alternateName: profile.username,
      url,
      ...(profile.bio && { description: profile.bio }),
      ...(profile.imageUrl && { image: profile.imageUrl }),
      ...(profile.links.length > 0 && { sameAs: profile.links.map((link) => link.url) }),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/WriteAction",
          userInteractionCount: counts.titles,
        },
      ],
    },
  ];
};

/**
 * Mediary's own rating and reviews of a title, attached to its node by
 * @id. An aggregate rating needs at least one score; a review needs a
 * body, which every review has. Only public reviews are handed over.
 */
export const communityNodes = (
  title: CatalogTitle,
  summary: RatingSummary,
  reviews: TitleReview[],
): JsonLdNode[] => {
  const titleId = `${absoluteUrl(titlePath(title))}#title`;
  const nodes: JsonLdNode[] = [];
  if (summary.average !== null && summary.count > 0) {
    nodes.push({
      "@type": "AggregateRating",
      "@id": `${titleId}-rating`,
      itemReviewed: { "@id": titleId },
      ratingValue: summary.average,
      bestRating: 10,
      worstRating: 0,
      ratingCount: summary.count,
    });
  }
  for (const review of reviews.slice(0, 5)) {
    nodes.push({
      "@type": "Review",
      "@id": `${absoluteUrl(titlePath(title))}#review-${review.uuid}`,
      itemReviewed: { "@id": titleId },
      author: { "@type": "Person", name: review.author.displayName },
      datePublished: review.createdAt.toISOString(),
      ...(review.headline && { name: review.headline }),
      reviewBody: review.body,
      ...(review.score !== null && {
        reviewRating: { "@type": "Rating", ratingValue: review.score, bestRating: 10, worstRating: 0 },
      }),
    });
  }
  return nodes;
};

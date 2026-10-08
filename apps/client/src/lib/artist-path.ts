type ArtistsPathParams = {
  page?: number;
  query?: string;
};

/** An artist's page: `/artists/radiohead`. The only place the address is built. */
export const artistPath = (slug: string): string => `/artists/${slug}`;

/** The artists index, a page of it and a search within it, every one its own address. */
export const artistsPath = ({ page, query }: ArtistsPathParams = {}): string => {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  return search ? `/artists?${search}` : "/artists";
};

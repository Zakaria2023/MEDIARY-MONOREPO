import { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogImageUrl } from "utils";
import { ArtistHero } from "@/components/artists/artist-hero";
import { ArtistRecords } from "@/components/artists/artist-records";
import { JsonLd } from "@/components/seo/json-ld";
import { artistPath } from "@/lib/artist-path";
import { loadArtist } from "@/lib/load-artist";
import { pageMetadata } from "@/lib/seo";
import { artistNode, breadcrumbNode, graph } from "@/lib/structured-data";
import { yearSpan } from "@/lib/year-span";

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const artist = await loadArtist(slug);
  if (!artist) {
    return { title: "Artist not found", robots: { index: false, follow: true } };
  }
  const years = yearSpan(artist.firstYear, artist.lastYear);
  const records = `${artist.recordCount} ${artist.recordCount === 1 ? "record" : "records"}`;

  return pageMetadata({
    title: `${artist.name}: albums and songs`,
    description: `Every ${artist.name} album and EP, with their songs${years ? `, from ${years}` : ""}. ${records} to track, score and share on Mediary.`,
    path: artistPath(artist.slug),
    image: artist.coverUrl ? catalogImageUrl(artist.coverUrl, 1200) : undefined,
    imageAlt: artist.name,
    keywords: [artist.name, `${artist.name} albums`, `${artist.name} discography`, ...artist.genres.map((genre) => genre.name)],
  });
};

/**
 * AN ARTIST: their picture, name and span, then every record Mediary holds
 * of theirs by kind. Each record opens its own page with its songs. A
 * MusicGroup in the structured data, with every album on it.
 */
const ArtistDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  const artist = await loadArtist(slug);
  if (!artist) {
    notFound();
  }
  const path = artistPath(artist.slug);

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd
        data={graph([
          artistNode(artist),
          breadcrumbNode(`${path}#breadcrumb`, [
            { name: "Music", path: "/music" },
            { name: "Artists", path: "/artists" },
            { name: artist.name, path },
          ]),
        ])}
      />
      <ArtistHero artist={artist} />
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <ArtistRecords name={artist.name} records={artist.records} />
      </div>
    </main>
  );
};

export default ArtistDetailPage;

import { ArrowUpRight, LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { FoundArtist } from "services";
import { Button } from "ui";
import { ArtistAvatar } from "@/components/artists/artist-avatar";
import { artistPath } from "@/lib/artist-path";

type FoundArtistRowProps = {
  artist: FoundArtist;
  working: boolean;
  disabled: boolean;
  onBring: () => void;
};

/**
 * One artist the music catalog has, with what tells two of one name apart
 * ("South Korean girl group"), then their page when Mediary has it or a
 * press that brings in their albums and EPs and opens it.
 */
export const FoundArtistRow = ({ artist, working, disabled, onBring }: FoundArtistRowProps) => (
  <li className="flex items-center gap-3 py-3">
    <ArtistAvatar name={artist.name} coverUrl={null} dominantColor={null} sizes="48px" className="w-12 shrink-0" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="line-clamp-1 text-sm font-medium text-ink">{artist.name}</span>
      <span className="line-clamp-1 text-xs text-muted">{artist.note ?? "Artist"}</span>
    </div>
    {artist.held ? (
      <Link
        href={artistPath(artist.held.slug)}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-secondary transition-colors hover:bg-hover hover:text-ink"
      >
        Open
        <ArrowUpRight size={15} />
      </Link>
    ) : (
      <Button variant="outline" size="sm" onClick={onBring} disabled={disabled || working} className="shrink-0">
        {working ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
        {working ? "Bringing in their records" : "Bring in their records"}
      </Button>
    )}
  </li>
);

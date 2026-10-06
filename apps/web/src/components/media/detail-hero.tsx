import { Bookmark, Heart, Plus, Share2, Star } from "lucide-react";
import { Badge, Button } from "ui";
import { PosterArt } from "@/components/media/poster-art";
import { MEDIA_TYPE_LABEL, MockTitle } from "@/lib/design/mock";

type DetailHeroProps = {
  title: MockTitle;
};

/**
 * The top of a detail page: the backdrop blurred behind a scrim, the poster
 * at 2:3, the title and its badges, the community score, and the one
 * primary action. On a phone the poster and the title stack; on a desktop
 * they sit side by side with the actions under the title.
 */
export const DetailHero = ({ title }: DetailHeroProps) => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <PosterArt
        title={title}
        shape="backdrop"
        className="h-full w-full scale-110 blur-2xl"
      />
      <div className="absolute inset-0 bg-page/60" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-backdrop-fade" />
    </div>

    <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-8 pt-8 sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:pt-16">
      <PosterArt title={title} className="w-36 shrink-0 ring-1 ring-hairline-strong sm:w-56" />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{MEDIA_TYPE_LABEL[title.type]}</Badge>
          <Badge>{title.year}</Badge>
          <Badge>{title.meta}</Badge>
        </div>

        <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
          {title.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5 tabular text-ink">
            <Star size={15} className="fill-current text-warning" />
            <span className="font-medium">{title.score.toFixed(1)}</span>
            <span className="text-muted">from 42k ratings</span>
          </span>
          <span>{title.genres.join(" · ")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="lg">
            <Plus size={18} />
            Add to Mediary
          </Button>
          <Button variant="icon" size="lg" aria-label="Favorite">
            <Heart size={18} />
          </Button>
          <Button variant="icon" size="lg" aria-label="Add to a list">
            <Bookmark size={18} />
          </Button>
          <Button variant="icon" size="lg" aria-label="Share">
            <Share2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  </section>
);

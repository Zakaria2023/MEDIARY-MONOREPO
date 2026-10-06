"use client";

import { Heart, Plus, Search } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Dropdown,
  Input,
  Skeleton,
  Tabs,
  Textarea,
  Tooltip,
} from "ui";
import { StatusChip } from "@/components/media/status-chip";

type Tab = "anime" | "game" | "movie";

/** Every primitive, in every state worth seeing. */
export const PrimitivesShowcase = () => {
  const [tab, setTab] = useState<Tab>("anime");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [platform, setPlatform] = useState("ps5");

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-faint">Buttons</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus size={16} />
            Add to Mediary
          </Button>
          <Button variant="outline">Follow</Button>
          <Button variant="ghost">Edit</Button>
          <Button variant="icon" aria-label="Favorite">
            <Heart size={18} />
          </Button>
          <Button variant="danger">Remove</Button>
          <Button disabled>Saving</Button>
          <Button size="sm" variant="outline">
            Small
          </Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-faint">Badges and status chips</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>2023</Badge>
          <Badge tone="accent">Anime</Badge>
          <Badge tone="violet">RPG</Badge>
          <Badge tone="success">Finished</Badge>
          <Badge tone="warning">Hiatus</Badge>
          <Badge tone="danger">Cancelled</Badge>
          <StatusChip status="in_progress" type="game" />
          <StatusChip status="completed" type="movie" />
          <StatusChip status="paused" type="anime" />
          <StatusChip status="dropped" type="tv" />
          <StatusChip status="planned" type="game" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-faint">Tabs</h3>
        <div className="flex flex-col gap-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "anime", label: "Anime", count: 38 },
              { value: "game", label: "Games", count: 27 },
              { value: "movie", label: "Movies", count: 22 },
            ]}
          />
          <Tabs
            variant="line"
            value={tab}
            onChange={setTab}
            items={[
              { value: "anime", label: "Overview" },
              { value: "game", label: "Reviews" },
              { value: "movie", label: "Related" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-faint">Inputs</h3>
          <Input label="Username" placeholder="yourname" icon={<Search size={15} />} />
          <Input label="Started" type="date" />
          <Input label="Email" type="email" error="Enter a full address" defaultValue="not-an-email" />
          <Dropdown
            value={platform}
            onChange={setPlatform}
            placeholder="Platform"
            options={[
              { value: "ps5", label: "PlayStation 5" },
              { value: "pc", label: "PC" },
              { value: "switch", label: "Nintendo Switch" },
              { value: "xbox", label: "Xbox Series" },
            ]}
          />
          <Textarea label="Notes" placeholder="Anything you want to remember." rows={3} />
          <Checkbox label="Mark as favorite" />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-faint">Cards, skeletons, overlays</h3>
          <Card>
            <p className="text-sm text-secondary">
              A card is told apart from the page by its hairline, never by a shadow.
            </p>
          </Card>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton shape="poster" />
            <Skeleton shape="poster" />
            <Skeleton shape="poster" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="w-3/4" />
            <Skeleton className="w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Open a dialog
            </Button>
            <Tooltip label="Add to a list">
              <Button variant="icon" aria-label="Add to a list">
                <Plus size={18} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Remove from your library?"
        description="Your progress and your score on this title will be deleted."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => setDialogOpen(false)}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          The diary keeps its history; only the entry goes.
        </p>
      </Dialog>
    </div>
  );
};

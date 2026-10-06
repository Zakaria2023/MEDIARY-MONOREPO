import { AddSheet } from "@/components/add/add-sheet";
import { DetailHero } from "@/components/media/detail-hero";
import { AppShell } from "@/components/shared/app-shell";
import { find } from "@/lib/design/mock";

/**
 * PROTOTYPE: the add/update sheet, open over the detail page it belongs to.
 * On a phone it rises from the bottom; on a desktop it slides in from the
 * end edge and the page stays visible behind it.
 */
const AddPrototype = () => (
  <AppShell current="none">
    <DetailHero title={find("frieren")} />
    <AddSheet title={find("frieren")} />
  </AppShell>
);

export default AddPrototype;

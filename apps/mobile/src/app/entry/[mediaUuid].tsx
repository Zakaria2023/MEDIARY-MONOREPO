import { RequireMember } from "@/components/layout/require-member";
import { EntryScreen } from "@/components/tracking/entry-screen";

/** The sheet over a title, a library row or a home card: `/entry/<title uuid>`. Members only. */
const EntryRoute = () => (
  <RequireMember>
    <EntryScreen />
  </RequireMember>
);

export default EntryRoute;

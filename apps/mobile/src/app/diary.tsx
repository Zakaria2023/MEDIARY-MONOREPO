import { DiaryScreen } from "@/components/diary/diary-screen";
import { RequireMember } from "@/components/layout/require-member";

/** Every moment the member logged, under the day it happened. */
const DiaryRoute = () => (
  <RequireMember>
    <DiaryScreen />
  </RequireMember>
);

export default DiaryRoute;

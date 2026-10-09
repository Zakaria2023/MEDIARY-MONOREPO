"use server";

import { revalidatePath } from "next/cache";
import {
  addToList,
  createList,
  deletePlaythrough,
  deleteReview,
  ListChoice,
  OwnReview,
  Playthrough,
  removeFromList,
  savePlaythrough,
  saveReview,
  setFeaturedReview,
} from "services";
import { ActionResult, fail } from "utils";
import {
  deleteReviewSchema,
  DeleteReviewInput,
  listItemSchema,
  ListItemInput,
  listSchema,
  ListInput,
  reviewSchema,
  ReviewInput,
  featureReviewSchema,
  FeatureReviewInput,
  playthroughSchema,
  PlaythroughInput,
  playthroughTargetSchema,
  PlaythroughTargetInput,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "@/lib/server/action-limit";

export type ReviewActionResult = ActionResult & {
  review?: OwnReview;
};

export type ListChoiceActionResult = ActionResult & {
  choice?: ListChoice;
};

export type PlaythroughActionResult = ActionResult & {
  playthrough?: Playthrough;
};

/** A new list made from the add-to-list dialog, with the title already on it. */
export type NewListForTitleInput = ListInput & {
  mediaUuid: string;
};

/** Every title page shows reviews and ratings; the pattern revalidates them all. */
const revalidateTitlePages = () => {
  revalidatePath("/[type]/[slug]", "page");
};

/** The review composer's Save. */
export const saveReviewAction = async (
  _prevState: ReviewActionResult,
  input: ReviewInput,
): Promise<ReviewActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "review");
  if (limited) {
    return { error: limited };
  }
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the review" };
  }

  try {
    const review = await saveReview(user.uuid, parsed.data);
    revalidateTitlePages();
    return { success: true, review };
  } catch (error) {
    return fail(error, "Could not save your review");
  }
};

export const deleteReviewAction = async (input: DeleteReviewInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = deleteReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That review could not be found" };
  }

  try {
    await deleteReview(user.uuid, parsed.data.reviewUuid);
    revalidateTitlePages();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not remove your review");
  }
};

/** A tick in the add-to-list dialog. */
export const addToListAction = async (input: ListItemInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "listItem");
  if (limited) {
    return { error: limited };
  }
  const parsed = listItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That list could not be found" };
  }

  try {
    await addToList(user.uuid, parsed.data.listUuid, parsed.data.mediaUuid);
    revalidatePath("/lists", "layout");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not add this title to the list");
  }
};

/** An untick in the add-to-list dialog. */
export const removeFromListAction = async (input: ListItemInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = listItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That list could not be found" };
  }

  try {
    await removeFromList(user.uuid, parsed.data.listUuid, parsed.data.mediaUuid);
    revalidatePath("/lists", "layout");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not take this title off the list");
  }
};

/** "New list" inside the add-to-list dialog: made, and the title put on it. */
export const createListForTitleAction = async (
  _prevState: ListChoiceActionResult,
  input: NewListForTitleInput,
): Promise<ListChoiceActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "list");
  if (limited) {
    return { error: limited };
  }
  const parsed = listSchema.safeParse(input);
  const mediaUuid = listItemSchema.shape.mediaUuid.safeParse(input.mediaUuid);
  if (!parsed.success || !mediaUuid.success) {
    return { error: parsed.success ? "That title could not be found" : (parsed.error.issues[0]?.message ?? "Check the form") };
  }

  try {
    const list = await createList(user.uuid, parsed.data);
    await addToList(user.uuid, list.uuid, mediaUuid.data);
    revalidatePath("/lists", "layout");
    return {
      success: true,
      choice: { uuid: list.uuid, name: list.name, visibility: list.visibility, contains: true },
    };
  } catch (error) {
    return fail(error, "Could not create the list");
  }
};

/** Leads the profile with this review, or with none. */
export const featureReviewAction = async (input: FeatureReviewInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = featureReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That review could not be found" };
  }

  try {
    await setFeaturedReview(user.uuid, parsed.data.reviewUuid);
    revalidatePath("/profile/[username]", "page");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not change your featured review");
  }
};

/** The playthrough form's Save: a new run, or one corrected. */
export const savePlaythroughAction = async (
  _prevState: PlaythroughActionResult,
  input: PlaythroughInput,
): Promise<PlaythroughActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = playthroughSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the playthrough" };
  }

  try {
    const playthrough = await savePlaythrough(user.uuid, parsed.data);
    revalidateTitlePages();
    return { success: true, playthrough };
  } catch (error) {
    return fail(error, "Could not save the playthrough");
  }
};

export const deletePlaythroughAction = async (input: PlaythroughTargetInput): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const parsed = playthroughTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That playthrough could not be found" };
  }

  try {
    await deletePlaythrough(user.uuid, parsed.data.playthroughUuid);
    revalidateTitlePages();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not remove the playthrough");
  }
};

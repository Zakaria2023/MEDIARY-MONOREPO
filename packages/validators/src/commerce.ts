import { z } from "zod";
import {
  creatorCategories,
  invoiceStatuses,
  sponsorCampaignStatuses,
  sponsorSurfaces,
  storeLinkKinds,
  stores,
} from "../../../db/enum";

export type StoreLinkInput = z.infer<typeof storeLinkSchema>;
export type StoreLinkTargetInput = z.infer<typeof storeLinkTargetSchema>;
export type AdvertiserInput = z.infer<typeof advertiserSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignStatusInput = z.infer<typeof campaignStatusSchema>;
export type PlacementInput = z.infer<typeof placementSchema>;
export type PlacementTargetInput = z.infer<typeof placementTargetSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceStatusInput = z.infer<typeof invoiceStatusSchema>;
export type SponsorSeenInput = z.infer<typeof sponsorSeenSchema>;
export type SponsorReportInput = z.infer<typeof sponsorReportSchema>;
export type CreatorRequestInput = z.infer<typeof creatorRequestSchema>;
export type CreatorDecisionInput = z.infer<typeof creatorDecisionSchema>;
export type CreatorSettingsInput = z.infer<typeof creatorSettingsSchema>;
export type CreatorInviteInput = z.infer<typeof creatorInviteSchema>;
export type CreatorCampaignAnswerInput = z.infer<typeof creatorCampaignAnswerSchema>;
export type CreatorViewInput = z.infer<typeof creatorViewSchema>;

const optionalText = (max: number, message: string) => z.string().trim().max(max, message);

const httpsUrl = z
  .string()
  .trim()
  .url("Enter the full address, starting with https://")
  .max(1000, "That address is too long")
  .refine((value) => value.startsWith("https://"), "Use an https:// address");

/** A YYYY-MM-DD day from a date field. */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

/** An amount typed as money ("1250" or "1250.50"), kept in the minor unit. */
const money = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter an amount like 1250 or 1250.50");

/** Staff putting a store link on a title, or replacing the automatic one for that store. */
export const storeLinkSchema = z.object({
  mediaUuid: z.uuid(),
  store: z.enum(stores),
  kind: z.enum(storeLinkKinds),
  url: httpsUrl,
});

/** One store on one title, for hiding, showing again or removing what staff set. */
export const storeLinkTargetSchema = z.object({
  mediaUuid: z.uuid(),
  store: z.enum(stores),
});

/** A company that books placements. */
export const advertiserSchema = z.object({
  displayName: z.string().trim().min(2, "Give the name people will read").max(80, "Keep the name under 80 characters"),
  legalName: z.string().trim().min(2, "Give the company's legal name").max(160, "Keep it under 160 characters"),
  contactEmail: z.email("Enter an email address").max(255),
  billingReference: optionalText(120, "Keep it under 120 characters"),
});

/** A campaign's own fields. */
export const campaignSchema = z
  .object({
    advertiserUuid: z.uuid("Pick an advertiser"),
    name: z.string().trim().min(2, "Name the campaign").max(120, "Keep the name under 120 characters"),
    objective: optionalText(300, "Keep the objective under 300 characters"),
    startsOn: day,
    endsOn: day,
    budget: z.union([money, z.literal("")]),
    currency: z.string().trim().regex(/^[A-Z]{3}$/, "Use a three-letter currency code like USD"),
    frequencyCap: z.number("Enter a number").int().min(1, "At least once a day").max(20, "At most 20 a day"),
  })
  .refine((input) => input.endsOn > input.startsOn, { message: "End after it starts", path: ["endsOn"] });

/** Moving a campaign along: sent for approval, approved, paused, ended. */
export const campaignStatusSchema = z.object({
  campaignUuid: z.uuid(),
  status: z.enum(sponsorCampaignStatuses),
});

/** A sponsored title in one slot. The title is named by its Mediary address or uuid. */
export const placementSchema = z.object({
  campaignUuid: z.uuid(),
  title: z.string().trim().min(1, "Paste the title's Mediary address"),
  surface: z.enum(sponsorSurfaces),
  headline: z.string().trim().min(2, "Write a headline").max(80, "Keep the headline under 80 characters"),
  body: optionalText(200, "Keep it under 200 characters"),
  ctaLabel: z.string().trim().min(2, "Write the button's words").max(30, "Keep it under 30 characters"),
  destinationUrl: z.union([httpsUrl, z.literal("")]),
  weight: z.number("Enter a number").int().min(1, "At least 1").max(100, "At most 100"),
});

/** One placement, for pausing, resuming or removing it. */
export const placementTargetSchema = z.object({
  placementUuid: z.uuid(),
});

/** An invoice for a campaign. */
export const invoiceSchema = z.object({
  campaignUuid: z.uuid(),
  number: z.string().trim().min(1, "Give the invoice its number").max(40, "Keep it under 40 characters"),
  amount: money,
  dueOn: z.union([day, z.literal("")]),
});

/** An invoice issued, paid or voided. */
export const invoiceStatusSchema = z.object({
  invoiceUuid: z.uuid(),
  status: z.enum(invoiceStatuses),
});

/** The browser saying a placement was on screen. */
export const sponsorSeenSchema = z.object({
  placementUuid: z.uuid(),
});

/** A member saying a placement is not for them. */
export const sponsorReportSchema = z.object({
  placementUuid: z.uuid(),
  note: optionalText(300, "Keep the note under 300 characters"),
});

/** A member asking to be a verified creator. */
export const creatorRequestSchema = z.object({
  category: z.enum(creatorCategories),
  proofUrls: z
    .array(z.object({ url: httpsUrl }))
    .min(1, "Add at least one channel or page that is yours")
    .max(5, "Five links at most"),
  note: optionalText(500, "Keep the note under 500 characters"),
});

/** Staff deciding on a creator request. */
export const creatorDecisionSchema = z.object({
  creatorUuid: z.uuid(),
  decision: z.enum(["verify", "reject", "revoke"]),
  note: optionalText(300, "Keep the note under 300 characters"),
});

/** What a verified creator sets for themselves. */
export const creatorSettingsSchema = z.object({
  category: z.enum(creatorCategories),
  discoverable: z.boolean(),
});

/** Staff inviting a verified creator to a campaign, by handle. */
export const creatorInviteSchema = z.object({
  campaignUuid: z.uuid(),
  username: z.string().trim().min(1, "Enter the creator's handle").max(31),
  deliverables: z.string().trim().min(5, "Say what the creator is asked to make").max(1000, "Keep it under 1000 characters"),
  disclosure: z
    .string()
    .trim()
    .min(10, "Write the disclosure people will read on the work")
    .max(300, "Keep the disclosure under 300 characters"),
});

/** A creator answering an invitation: accepted with the list that is the work, or declined. */
export const creatorCampaignAnswerSchema = z
  .object({
    creatorCampaignUuid: z.uuid(),
    answer: z.enum(["accept", "decline"]),
    listUuid: z.uuid().optional(),
  })
  .refine((input) => input.answer === "decline" || Boolean(input.listUuid), {
    message: "Pick the list that is the work",
    path: ["listUuid"],
  });

/** The browser saying a creator's profile, list or taste comparison was opened, or a link of theirs pressed. */
export const creatorViewSchema = z.object({
  userUuid: z.uuid(),
  kind: z.enum(["profile", "list", "compare", "link"]),
});

import { z } from "zod";

export type UsernameInput = z.infer<typeof usernameSchema>;
export type WelcomeInput = z.infer<typeof welcomeSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PrivacyInput = z.infer<typeof privacySchema>;

/**
 * The public handle. Lowercase so `/@Ahmad` and `/@ahmad` are one address,
 * and the character set is the one that survives a URL, a share card and a
 * mention without escaping. Mirrors USERNAME_PATTERN in `utils`.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_]{3,30}$/,
    "3 to 30 characters: letters, numbers and underscores",
  );

/** The welcome screen: the one thing a new account must choose. */
export const welcomeSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1, "Add a name").max(80),
});

/** The profile form: what a user shows the world. */
export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Add a name").max(80),
  bio: z.string().trim().max(300, "Keep the bio under 300 characters"),
  location: z.string().trim().max(80),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Give the link a label").max(30),
        url: z.string().trim().url("Enter a full address, starting https://"),
      }),
    )
    .max(5, "Five links is plenty"),
});

const visibility = z.enum(["public", "followers", "private"]);

/** The privacy settings page. */
export const privacySchema = z.object({
  profileVisibility: visibility,
  libraryVisibility: visibility,
  activityVisibility: visibility,
  tasteComparison: z.enum(["everyone", "followers", "nobody"]),
  hideSpoilers: z.boolean(),
  showAdultContent: z.boolean(),
});

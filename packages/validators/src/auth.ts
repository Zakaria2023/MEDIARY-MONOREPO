import { z } from "zod";

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type CodeInput = z.infer<typeof codeSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/**
 * The shortest password the identity service accepts, as configured on its
 * dashboard. Repeated here so the form says so before the round trip; if
 * the dashboard setting changes, change this with it.
 */
export const PASSWORD_MIN_LENGTH = 15;

const email = z.string().trim().min(1, "Enter your email").email("That is not an email address");

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Keep it under 128 characters");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z.object({
  email,
  password: newPassword,
});

export const emailSchema = z.object({ email });

/** A six-digit code from an email. Spaces a person types between digits are dropped. */
export const codeSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{6}$/, "Enter the six-digit code")),
});

export const newPasswordSchema = z.object({ password: newPassword });

export const changePasswordSchema = z.object({
  /** Empty for an account that has never had a password (it signed up with Google). */
  currentPassword: z.string(),
  newPassword,
});

/** Deleting an account is confirmed by typing a word, not by a click alone. */
export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value.toLowerCase() === "delete", "Type delete to confirm"),
});

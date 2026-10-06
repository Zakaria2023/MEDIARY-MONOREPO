/** An error entry as the identity service reports it. */
type ServiceErrorEntry = {
  code?: unknown;
  message?: unknown;
  longMessage?: unknown;
};

/**
 * EVERY SENTENCE A PERSON SEES ABOUT SIGNING IN IS MEDIARY'S. The identity
 * service's own messages are never shown as they come: they are written for
 * developers, they change between versions, and some name the service.
 * Each known code maps to a sentence here; anything else falls back to the
 * caller's own message.
 */
const MESSAGES: Record<string, string> = {
  form_identifier_not_found: "There is no Mediary account with that email.",
  form_password_incorrect: "That password is not right. Try again, or sign in with a code instead.",
  incorrect_password: "That is not your current password.",
  form_password_pwned:
    "That password has appeared in a data breach elsewhere. Choose a different one.",
  form_password_length_too_short: "That password is too short.",
  form_password_not_strong_enough: "Choose a stronger password.",
  form_password_validation_failed: "That password is not right.",
  form_identifier_exists: "An account with that email already exists. Sign in instead.",
  form_param_format_invalid: "Check the email address.",
  form_code_incorrect: "That code is not right. Check the latest email and try again.",
  verification_expired: "That code has expired. Send a new one.",
  verification_failed: "That code is not right. Send a new one and try again.",
  too_many_requests: "Too many attempts. Wait a minute, then try again.",
  user_locked: "This account is locked for a while after too many attempts. Try again later.",
  session_exists: "You are already signed in.",
  identifier_already_signed_in: "You are already signed in.",
  captcha_invalid: "We could not confirm you are a person. Refresh the page and try again.",
  captcha_missing_token: "We could not confirm you are a person. Refresh the page and try again.",
  strategy_for_user_invalid:
    "This account signs in another way. Try the Google button or a code by email.",
  session_reverification_required:
    "For your security, sign out and sign back in, then try this again.",
};

const entriesOf = (error: unknown): ServiceErrorEntry[] => {
  if (typeof error !== "object" || error === null) {
    return [];
  }
  if ("errors" in error && Array.isArray((error as { errors: unknown }).errors)) {
    return (error as { errors: ServiceErrorEntry[] }).errors;
  }
  return [error as ServiceErrorEntry];
};

/** The first known code in an error, or null. */
export const authErrorCode = (error: unknown): string | null => {
  for (const entry of entriesOf(error)) {
    if (typeof entry.code === "string") {
      return entry.code;
    }
  }
  return null;
};

/** The sentence to show for an identity error. */
export const authErrorMessage = (error: unknown, fallback: string): string => {
  const code = authErrorCode(error);
  return (code && MESSAGES[code]) || fallback;
};

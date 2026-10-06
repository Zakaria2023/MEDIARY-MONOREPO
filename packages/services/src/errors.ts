/**
 * An error whose message is safe to show the user, as written. A Server
 * Action's `fail(error, fallback)` passes a ValidationError's message through
 * and replaces any other error's with the fallback, so a message that names
 * the exact fix reaches the screen and a database stack trace never does.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** The caller asked for something that is not theirs or does not exist. */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

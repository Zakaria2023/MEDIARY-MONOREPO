import { SelectUsers, Users } from "../../../db/schema/users";

/** A person as a feed line, a review or a list names them. */
export type SocialUser = Pick<SelectUsers, "uuid" | "username" | "displayName" | "imageUrl">;

/** The columns of a SocialUser, for a select on Users or an alias of it. */
export const socialUserColumns = (table: typeof Users) => ({
  uuid: table.uuid,
  username: table.username,
  displayName: table.displayName,
  imageUrl: table.imageUrl,
});

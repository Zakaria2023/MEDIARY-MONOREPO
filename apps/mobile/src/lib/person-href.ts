import { Href } from "expo-router";

/** Someone's profile in the app: `/people/sara`, the site's `/@sara`. */
export const personHref = (username: string): Href => ({
  pathname: "/people/[username]",
  params: { username },
});

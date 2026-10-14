import { CreatorCategory } from "@/db/enum";

type CreatorsPathParams = {
  category?: CreatorCategory;
  page?: number;
};

/** The creators directory, one kind of creator and a page of it, every one its own address. */
export const creatorsPath = ({ category, page }: CreatorsPathParams = {}): string => {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  return search ? `/creators?${search}` : "/creators";
};

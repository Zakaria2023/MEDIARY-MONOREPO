import { useWindowDimensions } from "react-native";
import { space } from "./theme";

/** Columns on a poster grid: three on a phone, more as the screen widens. */
const columnsFor = (width: number): number => (width >= 900 ? 6 : width >= 600 ? 4 : 3);

/** A poster grid's columns and the width of one card, inside the page's side gutters. */
export const useGridWidth = () => {
  const { width } = useWindowDimensions();
  const columns = columnsFor(width);
  const gap = space[3];
  const cardWidth = Math.floor((width - space[4] * 2 - gap * (columns - 1)) / columns);
  return { columns, cardWidth, gap };
};

/**
 * Deals items from several lists into rows, one from each list in turn,
 * so every row mixes the lists instead of holding one of them.
 */
export const dealRows = <T,>(lists: T[][], rows: number, perList: number): T[][] => {
  const dealt: T[][] = Array.from({ length: rows }, () => []);
  let next = 0;
  for (let index = 0; index < perList; index += 1) {
    for (const list of lists) {
      const item = list[index];
      if (item !== undefined) {
        dealt[next % rows]?.push(item);
        next += 1;
      }
    }
  }
  return dealt;
};

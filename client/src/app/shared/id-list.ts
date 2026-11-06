// Turns a query parameter that can repeat into ids. ?kategori=3&kategori=1 gives ["3", "1"] and
// becomes [3, 1]; a single ?kategori=3 gives "3" and becomes [3]. Invalid and repeated ids are
// skipped, the same way toPageNumber (page-number.ts) turns an invalid page into 1.
export function toIdList(value: string | string[] | undefined): number[] {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const ids = values.map(Number).filter((id) => Number.isInteger(id) && id >= 1);
  // A Set keeps each id once.
  return [...new Set(ids)];
}

// Turns one id in the URL into a number: "3" becomes 3. A missing or invalid id becomes
// undefined. Used for :id and ?redigera= on the category pages.
export function toId(value: string | undefined): number | undefined {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 ? id : undefined;
}

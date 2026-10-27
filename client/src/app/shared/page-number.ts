// Turns ?sida= in the URL into a page number: "2" becomes 2. A missing or
// invalid page, e.g. ?sida=abc, becomes page 1. Used by every paginated list.
export function toPageNumber(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

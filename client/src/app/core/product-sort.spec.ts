import { toSort } from './product-sort';

describe('product-sort', () => {
  it('reads a sort from the URL, and treats a missing or unknown one as the newest first', () => {
    expect(toSort('lagst-pris')).toBe('lagst-pris');
    expect(toSort('hogst-pris')).toBe('hogst-pris');
    expect(toSort(undefined)).toBe('nyast');
    expect(toSort('popular')).toBe('nyast');
    expect(toSort('toString')).toBe('nyast');
  });
});

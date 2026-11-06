import { toIdList } from './id-list';

describe('toIdList', () => {
  it('turns one or several values into ids', () => {
    expect(toIdList('3')).toEqual([3]);
    expect(toIdList(['3', '1'])).toEqual([3, 1]);
  });

  it('skips missing, invalid and repeated ids', () => {
    expect(toIdList(undefined)).toEqual([]);
    expect(toIdList(['abc', '0', '-2', '1.5', '4', '4'])).toEqual([4]);
  });
});

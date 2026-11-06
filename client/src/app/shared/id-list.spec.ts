import { toId, toIdList } from './id-list';

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

describe('toId', () => {
  it('turns a valid id into a number and anything else into undefined', () => {
    expect(toId('3')).toBe(3);
    expect(toId(undefined)).toBeUndefined();
    expect(toId('abc')).toBeUndefined();
    expect(toId('0')).toBeUndefined();
    expect(toId('2.5')).toBeUndefined();
  });
});

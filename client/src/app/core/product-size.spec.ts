import { ProductSize, sizeText, weightText } from './product-size';

const NO_SIZE: ProductSize = {
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  diameterCm: null,
  weightGrams: null,
};

//   is the no-break space.
describe('sizeText', () => {
  it('puts the height last, after the diameter', () => {
    expect(sizeText({ ...NO_SIZE, heightCm: 9, diameterCm: 8 })).toEqual({
      shown: 'Ø 8 × H 9 cm',
      spoken: 'diameter 8 cm, höjd 9 cm',
    });
  });

  it('shows every given side, with a Swedish decimal comma', () => {
    expect(sizeText({ ...NO_SIZE, lengthCm: 40, widthCm: 25.5, heightCm: 2 })?.shown).toBe(
      'L 40 × B 25,5 × H 2 cm',
    );
  });

  it('is null when no measure is given, also with a weight', () => {
    expect(sizeText({ ...NO_SIZE, weightGrams: 350 })).toBeNull();
  });
});

describe('weightText', () => {
  it('shows grams below 1 000 g and kilograms from it', () => {
    expect(weightText(350)).toBe('350 g');
    expect(weightText(1000)).toBe('1 kg');
    expect(weightText(1250)).toBe('1,25 kg');
  });

  it('is null when no weight is given', () => {
    expect(weightText(null)).toBeNull();
  });
});

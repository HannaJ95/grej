// The item's own size and weight (ProductSizeDto in the API). Null = not given.
export interface ProductSize {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  diameterCm: number | null;
  weightGrams: number | null;
}

// The height last, as in "Ø 8 × H 9 cm" and "B 30 × H 40 cm".
const MEASURES = [
  { key: 'lengthCm', short: 'L', word: 'längd' },
  { key: 'widthCm', short: 'B', word: 'bredd' },
  { key: 'diameterCm', short: 'Ø', word: 'diameter' },
  { key: 'heightCm', short: 'H', word: 'höjd' },
] as const;

// "shown" for the eye, "spoken" for screen readers, which would read "Ø" as a letter. The
// no-break spaces keep "Ø 8" together when the line wraps. Null when no measure is given.
export function sizeText(size: ProductSize): { shown: string; spoken: string } | null {
  const given = MEASURES.flatMap(({ key, short, word }) => {
    const value = size[key];
    return value === null ? [] : [{ short, word, number: swedish(value) }];
  });
  if (given.length === 0) {
    return null;
  }
  return {
    shown: given.map((m) => `${m.short} ${m.number}`).join(' × ') + ' cm',
    spoken: given.map((m) => `${m.word} ${m.number} cm`).join(', '),
  };
}

// Kilograms from 1 000 g, e.g. "1,25 kg".
export function weightText(grams: number | null): string | null {
  if (grams === null) {
    return null;
  }
  return grams < 1000 ? `${swedish(grams)} g` : `${swedish(grams / 1000)} kg`;
}

function swedish(value: number): string {
  return value.toLocaleString('sv-SE', { maximumFractionDigits: 2 });
}

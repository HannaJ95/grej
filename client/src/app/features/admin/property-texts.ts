import { PropertyKind } from '../../core/product-property';

// The material and color pages share their code but not their words ("materialet", "färgen").
// Templates use the titlecase pipe when a word starts a sentence.
export interface PropertyTexts {
  // "Redigera färg"
  singular: string;
  // "Alla färger"
  plural: string;
  // "Ta bort färgen"
  theOne: string;
  // "Laddar färgerna…"
  theAll: string;
  // "Ny färg"
  newOne: string;
  // The name field's placeholder.
  example: string;
  path: string;
}

export const PROPERTY_TEXTS: Record<PropertyKind, PropertyTexts> = {
  materials: {
    singular: 'material',
    plural: 'material',
    theOne: 'materialet',
    theAll: 'materialen',
    newOne: 'Nytt material',
    example: 'T.ex. Trä',
    path: '/admin/material',
  },
  colors: {
    singular: 'färg',
    plural: 'färger',
    theOne: 'färgen',
    theAll: 'färgerna',
    newOne: 'Ny färg',
    example: 'T.ex. Grön',
    path: '/admin/farger',
  },
};

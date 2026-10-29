import { PropertyKind } from '../../core/product-property';

// The Swedish words for one kind of list. The material and color pages share their code,
// but not their words: "materialet" but "färgen". Templates use the titlecase pipe when a
// word starts a sentence, e.g. "Färgerna kunde inte visas."
export interface PropertyTexts {
  // "Redigera färg"
  singular: string;
  // "Det finns inga färger än."
  plural: string;
  // "Ta bort färgen"
  theOne: string;
  // "Laddar färgerna…"
  theAll: string;
  // The link to the form for a new one, and its heading.
  newOne: string;
  // The list page's URL in the CMS (app.routes.ts).
  path: string;
}

export const PROPERTY_TEXTS: Record<PropertyKind, PropertyTexts> = {
  materials: {
    singular: 'material',
    plural: 'material',
    theOne: 'materialet',
    theAll: 'materialen',
    newOne: 'Nytt material',
    path: '/admin/material',
  },
  colors: {
    singular: 'färg',
    plural: 'färger',
    theOne: 'färgen',
    theAll: 'färgerna',
    newOne: 'Ny färg',
    path: '/admin/farger',
  },
};

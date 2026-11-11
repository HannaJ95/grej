// The same words as in the API's URLs, e.g. /api/materials and /api/admin/colors.
export type PropertyKind = 'materials' | 'colors';

// A material or a color (PropertyDto in the API).
export interface ProductProperty {
  id: number;
  name: string;
}

// PropertyDetailsDto in the API, in the CMS's lists. productCount includes hidden products.
export interface ProductPropertyDetails extends ProductProperty {
  productCount: number;
}

// A material or a color in the shop's filter (ShopPropertyDto in the API). productCount is the
// number of active products; the API leaves out those without any.
export interface ShopProperty extends ProductProperty {
  productCount: number;
}

// The two lists of choices the admin keeps in the CMS. The same words as in the API's
// URLs, /api/admin/materials and /api/admin/colors.
export type PropertyKind = 'materials' | 'colors';

// A material or a color (PropertyDto in the API).
export interface ProductProperty {
  id: number;
  name: string;
}

// One material or color with the number of products that have it (PropertyDetailsDto
// in the API). The form uses the number to warn before deleting.
export interface ProductPropertyDetails extends ProductProperty {
  productCount: number;
}

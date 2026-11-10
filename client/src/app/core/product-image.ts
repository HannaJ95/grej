// A product's image (ProductImageDto in the API), in both the shop and the CMS.
// The browser loads it straight from Supabase Storage.
export interface ProductImage {
  // The CMS removes and moves an image by its id.
  id: number;
  url: string;
  altText: string;
}

// The same limit as Product.MaxImages in the API (constraints.md).
export const MAX_IMAGES = 10;

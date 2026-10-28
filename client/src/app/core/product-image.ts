// A product's image (ProductImageDto in the API), in both the shop and the CMS.
// The browser loads it straight from Supabase Storage.
export interface ProductImage {
  url: string;
  altText: string;
}

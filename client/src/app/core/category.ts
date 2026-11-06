// A category in the CMS (CategoryDto in the API).
export interface Category {
  id: number;
  name: string;
}

// A category in the shop's filter (ShopCategoryDto in the API). productCount is the number of
// active products in it; the API leaves out categories without any.
export interface ShopCategory {
  id: number;
  name: string;
  productCount: number;
}

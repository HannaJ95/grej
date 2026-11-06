// A category in the CMS (CategoryDto in the API). parentId and parentName are null for a main
// category; a subcategory has its main category's. productCount counts hidden products too, and
// for a main category also its subcategories' products.
export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
  subcategoryCount: number;
}

// A category in the shop's filter (ShopCategoryDto in the API). productCount is the number of
// active products in it; the API leaves out categories without any.
export interface ShopCategory {
  id: number;
  name: string;
  productCount: number;
}

// The name the CMS shows in menus, e.g. "Keramik › Skålar" for a subcategory.
export function categoryLabel(category: Category): string {
  return category.parentName === null ? category.name : `${category.parentName} › ${category.name}`;
}

import { httpResource } from '@angular/common/http';
import { Service, Signal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { NO_FILTER, ProductFilter } from './product-filter';
import { ProductImage } from './product-image';

// A product as the API returns it (ProductDto), both alone and in the list.
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  // How many can be bought. Never below 0 (ProductService.ToDto in the API).
  stock: number;
  isSoldOut: boolean;
  // Null if the product has no image.
  image: ProductImage | null;
  // Only the names, sorted, e.g. ["Glasyr", "Lera"]. Empty if the product has none.
  materials: string[];
  colors: string[];
}

// ProductPageDto in the API. highestPrice ignores the price filter, so the price slider keeps its
// scale. Null when no product matches the other filters.
export interface ProductPage extends PagedResult<Product> {
  highestPrice: number | null;
}

// "Få kvar" when this many or fewer are left (0 is "Slutsåld").
export const FEW_LEFT = 2;

@Service()
export class ProductService {
  // Must be called when a component is created (in a field), like inject().
  // The product is fetched again whenever the id signal changes.
  getProduct(id: Signal<string>) {
    return httpResource<Product>(() => `${environment.apiUrl}/api/products/${id()}`);
  }

  // E.g. GET /api/products?page=2&categoryId=1&categoryId=3&minPrice=200. The API decides the
  // page size. The start page leaves out the filter.
  getProducts(page: Signal<number>, filter: Signal<ProductFilter> = signal(NO_FILTER)) {
    return httpResource<ProductPage>(() => {
      const { categoryIds, materialIds, colorIds, minPrice, maxPrice } = filter();
      return {
        url: `${environment.apiUrl}/api/products`,
        // An array repeats the key once per id, and an empty one adds nothing. A price is only
        // sent when it is set.
        params: {
          page: page(),
          categoryId: categoryIds,
          materialId: materialIds,
          colorId: colorIds,
          ...(minPrice === undefined ? {} : { minPrice }),
          ...(maxPrice === undefined ? {} : { maxPrice }),
        },
      };
    });
  }
}

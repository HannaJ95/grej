import { httpResource } from '@angular/common/http';
import { Service, Signal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { Parcel } from './parcel';
import { NO_FILTER, ProductFilter } from './product-filter';
import { ProductImage } from './product-image';
import { DEFAULT_SORT, ProductSort, SORTS } from './product-sort';

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
  // The main image first, which the lists and the cart show. Empty if the product has none.
  images: ProductImage[];
  // Only the names, sorted, e.g. ["Glasyr", "Lera"]. Empty if the product has none.
  materials: string[];
  colors: string[];
  // For the shipping in the cart.
  parcel: Parcel;
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

  // E.g. GET /api/products?page=2&categoryId=1&categoryId=3&minPrice=200&sort=priceAscending. The
  // API decides the page size. The start page leaves out the filter and the sort.
  getProducts(
    page: Signal<number>,
    filter: Signal<ProductFilter> = signal(NO_FILTER),
    sort: Signal<ProductSort> = signal(DEFAULT_SORT),
  ) {
    return httpResource<ProductPage>(() => {
      const { categoryIds, materialIds, colorIds, minPrice, maxPrice, search } = filter();
      const order = sort();
      return {
        url: `${environment.apiUrl}/api/products`,
        // An array repeats the key once per id, and an empty one adds nothing. A price, a search
        // or a sort is only sent when it is set.
        params: {
          page: page(),
          categoryId: categoryIds,
          materialId: materialIds,
          colorId: colorIds,
          ...(minPrice === undefined ? {} : { minPrice }),
          ...(maxPrice === undefined ? {} : { maxPrice }),
          ...(search ? { search } : {}),
          ...(order === DEFAULT_SORT ? {} : { sort: SORTS[order].api }),
        },
      };
    });
  }
}

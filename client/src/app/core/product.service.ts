import { httpResource } from '@angular/common/http';
import { Service, Signal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { Parcel } from './parcel';
import { NO_FILTER, ProductFilter } from './product-filter';
import { ProductImage } from './product-image';
import { ProductSize } from './product-size';
import { DEFAULT_SORT, ProductSort, SORTS } from './product-sort';

// ProductDto in the API, both alone and in the list.
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  // Never below 0 (ProductService.ToDto in the API).
  stock: number;
  isSoldOut: boolean;
  // The main image first.
  images: ProductImage[];
  // Names, sorted.
  materials: string[];
  colors: string[];
  // For the shipping in the cart.
  parcel: Parcel;
  // For the product page.
  size: ProductSize;
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
  getProduct(id: Signal<string>) {
    return httpResource<Product>(() => `${environment.apiUrl}/api/products/${id()}`);
  }

  // The API decides the page size. The start page leaves out the filter and the sort.
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
        // A price, a search or a sort is only sent when it is set.
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

import { httpResource } from '@angular/common/http';
import { Service, Signal, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
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

// "Få kvar" when this many or fewer are left (0 is "Slutsåld").
export const FEW_LEFT = 2;

// Fetches products from the API.
@Service()
export class ProductService {
  // Must be called when a component is created (in a field), like inject().
  // The product is fetched again whenever the id signal changes.
  getProduct(id: Signal<string>) {
    return httpResource<Product>(() => `${environment.apiUrl}/api/products/${id()}`);
  }

  // One page of products, e.g. GET /api/products?page=2&categoryId=1&categoryId=3. The API
  // decides the page size. No category ids = all categories, so the start page can leave them
  // out. Fetched again whenever one of the signals changes.
  getProducts(page: Signal<number>, categoryIds: Signal<number[]> = signal([])) {
    return httpResource<PagedResult<Product>>(() => ({
      url: `${environment.apiUrl}/api/products`,
      // An array becomes the same key once per id; an empty one adds nothing.
      params: { page: page(), categoryId: categoryIds() },
    }));
  }
}

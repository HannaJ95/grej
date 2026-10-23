import { httpResource } from '@angular/common/http';
import { Service, Signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';

// A product as the API returns it (ProductDto), both alone and in the list.
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  isSoldOut: boolean;
}

// Fetches products from the API.
@Service()
export class ProductService {
  // Must be called when a component is created (in a field), like inject().
  // The product is fetched again whenever the id signal changes.
  getProduct(id: Signal<string>) {
    return httpResource<Product>(() => `${environment.apiUrl}/api/products/${id()}`);
  }

  // One page of products, e.g. GET /api/products?page=2. The API decides the
  // page size. Fetched again whenever the page signal changes.
  getProducts(page: Signal<number>) {
    return httpResource<PagedResult<Product>>(() => ({
      url: `${environment.apiUrl}/api/products`,
      params: { page: page() },
    }));
  }
}

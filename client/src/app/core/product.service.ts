import { httpResource } from '@angular/common/http';
import { Service, Signal } from '@angular/core';
import { environment } from '../../environments/environment';

// The JSON that GET /api/products/{id} returns (ProductDto in the API).
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
}

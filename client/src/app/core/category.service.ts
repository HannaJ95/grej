import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { ShopCategory } from './category';

// Fetches the shop's categories from the API's open endpoint. The CMS uses AdminCategoryService.
@Service()
export class CategoryService {
  // All categories with products, sorted by name. Must be called when a component is created
  // (in a field), like ProductService.getProducts.
  getCategories() {
    return httpResource<ShopCategory[]>(() => `${environment.apiUrl}/api/categories`);
  }
}

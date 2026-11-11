import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { ShopCategory } from './category';

// Fetches the shop's categories from the API's open endpoint. The CMS uses AdminCategoryService.
@Service()
export class CategoryService {
  // One request per visit, shared by the footer (on every shop page), the start page and the
  // product list.
  private readonly categories = httpResource<ShopCategory[]>(
    () => `${environment.apiUrl}/api/categories`,
  );

  // All categories with products, sorted by name.
  getCategories() {
    return this.categories;
  }
}

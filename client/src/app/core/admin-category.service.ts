import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from './category';
import { PagedResult } from './paged-result';

// Reads and changes categories through the API's admin endpoints, the same way as
// AdminProductService. authInterceptor adds the admin's token to every request.
@Service()
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/admin/categories`;

  // One page of categories: each main category followed by its subcategories. The API sends
  // up to 100 per page, so the first page usually holds them all.
  getCategories(page: Signal<number>) {
    return httpResource<PagedResult<Category>>(() => ({
      url: this.url,
      params: { page: page() },
    }));
  }

  // One category. Nothing is fetched while the id is undefined, e.g. when the
  // form creates a new category.
  getCategory(id: Signal<string | undefined>) {
    return httpResource<Category>(() => {
      const value = id();
      return value === undefined ? undefined : `${this.url}/${value}`;
    });
  }

  // Resolves with the saved category. parentId is the main category, or null for a main
  // category. Throws on errors, e.g. when the API is down.
  create(name: string, parentId: number | null): Promise<Category> {
    return firstValueFrom(this.http.post<Category>(this.url, { name, parentId }));
  }

  async update(id: number, name: string, parentId: number | null): Promise<void> {
    await firstValueFrom(this.http.put(`${this.url}/${id}`, { name, parentId }));
  }

  // Resolves with 'hasProducts' or 'hasSubcategories' if the category has any. Then it is not
  // deleted, and the admin moves the products or deletes the subcategories first (ambiguity.md).
  async remove(id: number): Promise<'deleted' | 'hasProducts' | 'hasSubcategories'> {
    try {
      await firstValueFrom(this.http.delete(`${this.url}/${id}`));
      return 'deleted';
    } catch (error) {
      // 409: the body says why, e.g. { reason: 'hasSubcategories' } (AdminCategoriesController).
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return error.error?.reason === 'hasSubcategories' ? 'hasSubcategories' : 'hasProducts';
      }
      throw error;
    }
  }
}

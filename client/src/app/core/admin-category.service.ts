import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { inject, Service, Signal, signal } from '@angular/core';
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

  private readonly allWanted = signal(false);

  // Every category (the first page, up to 100), shared by the category pages and the numbers in
  // the admin's menu, so they always show the same thing. One resource for the whole app, since
  // the service is a singleton. Nothing is fetched until a category page calls loadAll(), so the
  // other admin pages send no extra request.
  readonly all = httpResource<PagedResult<Category>>(() =>
    this.allWanted() ? { url: this.url, params: { page: 1 } } : undefined,
  );

  // Starts fetching all (once) and returns it. Called when a category page is created.
  loadAll() {
    this.allWanted.set(true);
    return this.all;
  }

  // One page of categories: each main category followed by its subcategories. The API sends
  // up to 100 per page, so the first page usually holds them all. For the product form's menu.
  getCategories(page: Signal<number>) {
    return httpResource<PagedResult<Category>>(() => ({
      url: this.url,
      params: { page: page() },
    }));
  }

  // Resolves with the saved category. parentId is the main category, or null for a main
  // category. Throws on errors, e.g. when the API is down.
  // After every change, all is fetched again, so the lists and the menu's numbers are up to date.
  async create(name: string, parentId: number | null): Promise<Category> {
    const category = await firstValueFrom(this.http.post<Category>(this.url, { name, parentId }));
    this.all.reload();
    return category;
  }

  async update(id: number, name: string, parentId: number | null): Promise<void> {
    await firstValueFrom(this.http.put(`${this.url}/${id}`, { name, parentId }));
    this.all.reload();
  }

  // Resolves with 'hasProducts' or 'hasSubcategories' if the category has any. Then it is not
  // deleted, and the admin moves the products or deletes the subcategories first (ambiguity.md).
  async remove(id: number): Promise<'deleted' | 'hasProducts' | 'hasSubcategories'> {
    try {
      await firstValueFrom(this.http.delete(`${this.url}/${id}`));
      this.all.reload();
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

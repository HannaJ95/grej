import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { ProductProperty, ProductPropertyDetails, PropertyKind } from './product-property';

// Reads and changes materials and colors through the API's admin endpoints, the same way
// as AdminCategoryService. kind says which list, e.g. 'colors' gives /api/admin/colors.
@Service()
export class AdminPropertyService {
  private readonly http = inject(HttpClient);

  // One page sorted by name. The API sends up to 100 per page, so the first page
  // usually holds them all. kind is a signal since pages get it from the route.
  getProperties(kind: Signal<PropertyKind>, page: Signal<number>) {
    return httpResource<PagedResult<ProductProperty>>(() => ({
      url: this.url(kind()),
      params: { page: page() },
    }));
  }

  // One material or color with its product count. Nothing is fetched while the id is
  // undefined, e.g. when the form creates a new one.
  getProperty(kind: Signal<PropertyKind>, id: Signal<string | undefined>) {
    return httpResource<ProductPropertyDetails>(() => {
      const value = id();
      return value === undefined ? undefined : `${this.url(kind())}/${value}`;
    });
  }

  // Resolves with the saved material or color. Throws on errors, e.g. when the API is down.
  create(kind: PropertyKind, name: string): Promise<ProductProperty> {
    return firstValueFrom(this.http.post<ProductProperty>(this.url(kind), { name }));
  }

  async update(kind: PropertyKind, id: number, name: string): Promise<void> {
    await firstValueFrom(this.http.put(`${this.url(kind)}/${id}`, { name }));
  }

  // Also removes it from the products that have it (cascade in the database), so
  // unlike a category there is no 409.
  async remove(kind: PropertyKind, id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url(kind)}/${id}`));
  }

  private url(kind: PropertyKind): string {
    return `${environment.apiUrl}/api/admin/${kind}`;
  }
}

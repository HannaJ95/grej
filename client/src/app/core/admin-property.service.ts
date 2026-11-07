import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { ProductProperty, ProductPropertyDetails, PropertyKind } from './product-property';

// Materials and colors through the API's admin endpoints: 'colors' → /api/admin/colors.
@Service()
export class AdminPropertyService {
  private readonly http = inject(HttpClient);

  // Sorted by name, up to 100 per page.
  getProperties(kind: Signal<PropertyKind>, page: Signal<number>) {
    return httpResource<PagedResult<ProductProperty>>(() => ({
      url: this.url(kind()),
      params: { page: page() },
    }));
  }

  get(kind: PropertyKind, id: number): Promise<ProductPropertyDetails> {
    return firstValueFrom(this.http.get<ProductPropertyDetails>(`${this.url(kind)}/${id}`));
  }

  create(kind: PropertyKind, name: string): Promise<ProductProperty> {
    return firstValueFrom(this.http.post<ProductProperty>(this.url(kind), { name }));
  }

  async update(kind: PropertyKind, id: number, name: string): Promise<void> {
    await firstValueFrom(this.http.put(`${this.url(kind)}/${id}`, { name }));
  }

  // The database also removes it from its products, so unlike a category it never gives 409.
  async remove(kind: PropertyKind, id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url(kind)}/${id}`));
  }

  private url(kind: PropertyKind): string {
    return `${environment.apiUrl}/api/admin/${kind}`;
  }
}

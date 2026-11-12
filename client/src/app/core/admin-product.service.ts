import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { Parcel } from './parcel';
import { ProductImage } from './product-image';
import { ProductSize } from './product-size';
import { DEFAULT_SORT, ProductSort, SORTS } from './product-sort';

// AdminProductDto in the API. The real stock, below 0 if the last item was sold twice.
export interface AdminProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  categoryId: number;
  materialIds: number[];
  colorIds: number[];
  // The main image first.
  images: ProductImage[];
  parcel: Parcel;
  size: ProductSize;
  // ISO date and time, in UTC.
  createdAt: string;
}

// ProductRequest in the API.
export interface ProductInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId: number;
  // They replace the product's old ones.
  materialIds: number[];
  colorIds: number[];
  parcel: Parcel;
  size: ProductSize;
}

// ?sortera= in the CMS product list: the shop's sorts, and the oldest first too.
export type AdminProductSort = ProductSort | 'aldst';

// In the order the select shows them.
export const ADMIN_SORTS: Record<AdminProductSort, { label: string; api: string }> = {
  nyast: SORTS.nyast,
  aldst: { label: 'Äldst först', api: 'oldest' },
  'lagst-pris': SORTS['lagst-pris'],
  'hogst-pris': SORTS['hogst-pris'],
};

// Missing or unknown becomes the default, like toSort in product-sort.ts.
export function toAdminSort(value: string | undefined): AdminProductSort {
  return value !== undefined && Object.hasOwn(ADMIN_SORTS, value)
    ? (value as AdminProductSort)
    : DEFAULT_SORT;
}

// ?visa= in the CMS product list. Undefined shows both.
export type ProductVisibility = 'synliga' | 'dolda';

export function toVisibility(value: string | undefined): ProductVisibility | undefined {
  return value === 'synliga' || value === 'dolda' ? value : undefined;
}

// What the CMS product list shows. One id per filter, unlike the shop's lists.
export interface AdminProductQuery {
  page: number;
  // '' = no search.
  search: string;
  categoryId: number | undefined;
  materialId: number | undefined;
  colorId: number | undefined;
  visibility: ProductVisibility | undefined;
  sort: AdminProductSort;
}

export const ALL_PRODUCTS: AdminProductQuery = {
  page: 1,
  search: '',
  categoryId: undefined,
  materialId: undefined,
  colorId: undefined,
  visibility: undefined,
  sort: DEFAULT_SORT,
};

// The page and the sort don't count, since they never hide a product.
export function isFiltered(query: AdminProductQuery): boolean {
  const { search, categoryId, materialId, colorId, visibility } = query;
  return (
    search !== '' ||
    categoryId !== undefined ||
    materialId !== undefined ||
    colorId !== undefined ||
    visibility !== undefined
  );
}

// authInterceptor adds the admin's token, without which the API answers 401 or 403.
@Service()
export class AdminProductService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/admin/products`;

  // Only what is set is sent.
  getProducts(query: Signal<AdminProductQuery>) {
    return httpResource<PagedResult<AdminProduct>>(() => {
      const { page, search, categoryId, materialId, colorId, visibility, sort } = query();
      return {
        url: this.url,
        params: {
          page,
          ...(search ? { search } : {}),
          ...(categoryId === undefined ? {} : { categoryId }),
          ...(materialId === undefined ? {} : { materialId }),
          ...(colorId === undefined ? {} : { colorId }),
          ...(visibility === undefined ? {} : { isActive: visibility === 'synliga' }),
          ...(sort === DEFAULT_SORT ? {} : { sort: ADMIN_SORTS[sort].api }),
        },
      };
    });
  }

  // Nothing is fetched for a new product, whose id is undefined.
  getProduct(id: Signal<string | undefined>) {
    return httpResource<AdminProduct>(() => {
      const value = id();
      return value === undefined ? undefined : `${this.url}/${value}`;
    });
  }

  create(product: ProductInput): Promise<AdminProduct> {
    return firstValueFrom(this.http.post<AdminProduct>(this.url, product));
  }

  // originalStock is the stock the form was opened with. 'stockChanged': a customer has bought
  // the product since then, and nothing was saved.
  async update(
    id: number,
    product: ProductInput,
    originalStock: number,
  ): Promise<'saved' | 'stockChanged'> {
    try {
      await firstValueFrom(this.http.put(`${this.url}/${id}`, { ...product, originalStock }));
      return 'saved';
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return 'stockChanged';
      }
      throw error;
    }
  }

  // 'onOrder': not deleted, so the admin hides it instead (constraints.md).
  async remove(id: number): Promise<'deleted' | 'onOrder'> {
    try {
      await firstValueFrom(this.http.delete(`${this.url}/${id}`));
      return 'deleted';
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return 'onOrder';
      }
      throw error;
    }
  }

  // The image methods resolve with the product's images afterwards, in order.

  // 'full' when the product already has MAX_IMAGES. Multipart, since JSON cannot carry a file.
  async addImage(id: number, file: File, altText: string): Promise<ProductImage[] | 'full'> {
    const form = new FormData();
    form.append('file', file);
    form.append('altText', altText);
    try {
      // The browser sets Content-Type, with the separator between the parts.
      return await firstValueFrom(this.http.post<ProductImage[]>(`${this.url}/${id}/images`, form));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return 'full';
      }
      throw error;
    }
  }

  removeImage(id: number, imageId: number): Promise<ProductImage[]> {
    return firstValueFrom(this.http.delete<ProductImage[]>(`${this.url}/${id}/images/${imageId}`));
  }

  // imageIds is every image id of the product, in the new order.
  orderImages(id: number, imageIds: number[]): Promise<ProductImage[]> {
    return firstValueFrom(
      this.http.put<ProductImage[]>(`${this.url}/${id}/images/order`, { imageIds }),
    );
  }
}

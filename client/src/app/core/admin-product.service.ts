import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from './paged-result';
import { Parcel } from './parcel';
import { ProductImage } from './product-image';

// A product as the CMS sees it (AdminProductDto in the API): hidden products too,
// and the real stock, which is below 0 if the last item was sold twice.
export interface AdminProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  categoryId: number;
  // The ids of the product's materials and colors. Empty if it has none.
  materialIds: number[];
  colorIds: number[];
  // In order, the main image first. Empty if the product has none.
  images: ProductImage[];
  parcel: Parcel;
}

// What the CMS form sends when a product is created or saved (ProductRequest in the API).
export interface ProductInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId: number;
  // Several of each, or none (ambiguity.md). They replace the product's old ones.
  materialIds: number[];
  colorIds: number[];
  parcel: Parcel;
}

// Reads and changes products through the API's admin endpoints. authInterceptor adds
// the admin's token to every request, and the API answers 401 or 403 without it.
@Service()
export class AdminProductService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/admin/products`;

  // One page of all products, hidden ones too. Fetched again whenever the page changes.
  getProducts(page: Signal<number>) {
    return httpResource<PagedResult<AdminProduct>>(() => ({
      url: this.url,
      params: { page: page() },
    }));
  }

  // One product, hidden or not. Nothing is fetched while the id is undefined,
  // e.g. when the form creates a new product.
  getProduct(id: Signal<string | undefined>) {
    return httpResource<AdminProduct>(() => {
      const value = id();
      return value === undefined ? undefined : `${this.url}/${value}`;
    });
  }

  // Resolves with the saved product. Throws on errors, e.g. when the API is down.
  create(product: ProductInput): Promise<AdminProduct> {
    return firstValueFrom(this.http.post<AdminProduct>(this.url, product));
  }

  // originalStock is the stock the form was opened with. Resolves with 'stockChanged'
  // if a customer has bought the product since then; nothing is saved in that case.
  async update(
    id: number,
    product: ProductInput,
    originalStock: number,
  ): Promise<'saved' | 'stockChanged'> {
    try {
      await firstValueFrom(this.http.put(`${this.url}/${id}`, { ...product, originalStock }));
      return 'saved';
    } catch (error) {
      // 409: the request was fine, but the stock has changed (AdminProductsController).
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return 'stockChanged';
      }
      throw error;
    }
  }

  // Resolves with 'onOrder' if the product is on an order. Then it is not deleted,
  // and the admin hides it instead (constraints.md).
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

  // The image methods resolve with the product's images afterwards, in order, and throw on
  // other errors, e.g. when the API says the file is not an image.

  // Adds the image last, or says 'full' when the product already has MAX_IMAGES (409). Sent as
  // a form with a file (multipart/form-data), like a <form> with <input type="file">, since JSON
  // cannot carry a file.
  async addImage(id: number, file: File, altText: string): Promise<ProductImage[] | 'full'> {
    const form = new FormData();
    form.append('file', file);
    form.append('altText', altText);
    try {
      // No Content-Type here: the browser sets it, together with the separator between the parts.
      return await firstValueFrom(this.http.post<ProductImage[]>(`${this.url}/${id}/images`, form));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return 'full';
      }
      throw error;
    }
  }

  // Removes the image from the product, and its file from Supabase Storage.
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

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminProductService, ProductInput } from './admin-product.service';

describe('AdminProductService', () => {
  let products: AdminProductService;
  let httpTesting: HttpTestingController;

  const vase: ProductInput = {
    title: 'Vas',
    description: '',
    price: 300,
    stock: 2,
    isActive: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    products = TestBed.inject(AdminProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the stock the form was opened with when saving', async () => {
    const result = products.update(5, vase, 1);

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ ...vase, originalStock: 1 });
    // 204 No Content, as AdminProductsController answers.
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(await result).toBe('saved');
  });

  it('tells when the stock has changed since the form was opened (409)', async () => {
    const result = products.update(5, vase, 1);

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5'))
      .flush(null, { status: 409, statusText: 'Conflict' });

    expect(await result).toBe('stockChanged');
  });

  it('tells when a product cannot be deleted since it is on an order (409)', async () => {
    const result = products.remove(5);

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5'))
      .flush(null, { status: 409, statusText: 'Conflict' });

    expect(await result).toBe('onOrder');
  });

  it('throws on other errors, e.g. when the API is down', async () => {
    const result = products.update(5, vase, 1);

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5'))
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await expect(result).rejects.toThrow();
  });
});

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
    categoryId: 1,
    materialIds: [3],
    colorIds: [],
    parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
  };
  const image = { id: 12, url: 'https://storage.test/vas.png', altText: 'En blå vas' };

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

  it('sends a new image and its alt text as a form, and resolves with the images', async () => {
    const file = new File(['png'], 'vas.png', { type: 'image/png' });
    const result = products.addImage(5, file, 'En blå vas');

    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/api/admin/products/5/images'),
    );
    expect(request.request.method).toBe('POST');
    // The same names as the parameters in AdminProductsController.AddImage.
    const form = request.request.body as FormData;
    expect(form.get('file')).toBe(file);
    expect(form.get('altText')).toBe('En blå vas');
    request.flush([image]);

    expect(await result).toEqual([image]);
  });

  it("says 'full' when the product already has every image it can have (409)", async () => {
    const result = products.addImage(5, new File(['png'], 'vas.png'), 'En blå vas');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5/images'))
      .flush(null, { status: 409, statusText: 'Conflict' });

    expect(await result).toBe('full');
  });

  it('removes one image by its id', async () => {
    const result = products.removeImage(5, 12);

    httpTesting
      .expectOne(
        (req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5/images/12'),
      )
      .flush([]);

    expect(await result).toEqual([]);
  });

  it('sends every image id in the new order', async () => {
    const result = products.orderImages(5, [12, 10]);

    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/api/admin/products/5/images/order'),
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ imageIds: [12, 10] });
    request.flush([image]);

    expect(await result).toEqual([image]);
  });

  it('throws on other errors, e.g. when the API is down', async () => {
    const result = products.update(5, vase, 1);

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5'))
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await expect(result).rejects.toThrow();
  });
});

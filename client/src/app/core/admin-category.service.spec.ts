import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminCategoryService } from './admin-category.service';

describe('AdminCategoryService', () => {
  let categories: AdminCategoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    categories = TestBed.inject(AdminCategoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the name and resolves with the saved category', async () => {
    const result = categories.create('Keramik');

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/categories'));
    expect(request.request.method).toBe('POST');
    // The same name as in CategoryRequest in the API.
    expect(request.request.body).toEqual({ name: 'Keramik' });
    request.flush({ id: 3, name: 'Keramik' });

    expect(await result).toEqual({ id: 3, name: 'Keramik' });
  });

  it('tells when a category cannot be deleted since it has products (409)', async () => {
    const result = categories.remove(3);

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/categories/3'))
      .flush(null, { status: 409, statusText: 'Conflict' });

    expect(await result).toBe('hasProducts');
  });
});

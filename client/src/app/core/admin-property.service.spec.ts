import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminPropertyService } from './admin-property.service';

describe('AdminPropertyService', () => {
  let properties: AdminPropertyService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    properties = TestBed.inject(AdminPropertyService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the name to the list that kind says and resolves with the saved color', async () => {
    const result = properties.create('colors', 'Blå');

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/colors'));
    expect(request.request.method).toBe('POST');
    // The same name as in PropertyRequest in the API.
    expect(request.request.body).toEqual({ name: 'Blå' });
    request.flush({ id: 2, name: 'Blå' });

    expect(await result).toEqual({ id: 2, name: 'Blå' });
  });

  it('deletes a material', async () => {
    const result = properties.remove('materials', 3);

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/materials/3'))
      .flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeUndefined();
  });
});

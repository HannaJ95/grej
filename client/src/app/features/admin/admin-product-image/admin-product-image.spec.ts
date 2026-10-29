import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProduct } from '../../../core/admin-product.service';
import { AdminProductImage } from './admin-product-image';

describe('AdminProductImage', () => {
  let httpTesting: HttpTestingController;
  let fixture: ComponentFixture<AdminProductImage>;

  const vase: AdminProduct = {
    id: 5,
    title: 'Vas',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: 2,
    isActive: true,
    categoryId: 1,
    materialIds: [],
    colorIds: [],
    image: null,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    // Only this component, with the product the edit page would give it.
    fixture = TestBed.createComponent(AdminProductImage);
    fixture.componentRef.setInput('product', vase);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
  });

  it('shows what is missing and sends nothing when nothing is filled in', async () => {
    await send();

    expect(page().textContent).toContain('Välj en bild.');
    expect(page().textContent).toContain('Beskriv bilden.');
  });

  it('refuses a file that is not jpg, png or webp, and sends nothing', async () => {
    await choose(new File(['gif'], 'vas.gif', { type: 'image/gif' }));
    type('#alt-text', 'En blå vas');

    await send();

    expect(page().textContent).toContain('Bilden måste vara en jpg, png eller webp.');
  });

  it('uploads the image and shows it', async () => {
    await choose(new File(['png'], 'vas.png', { type: 'image/png' }));
    type('#alt-text', 'En blå vas');

    await send();
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5/image'))
      .flush({ url: 'https://storage.test/vas.png', altText: 'En blå vas' });
    await settle();

    const image = page().querySelector('img')!;
    expect(image.getAttribute('src')).toBe('https://storage.test/vas.png');
    expect(image.getAttribute('alt')).toBe('En blå vas');
    // The form is empty again, without showing "Välj en bild.".
    expect(page().querySelector<HTMLInputElement>('#alt-text')!.value).toBe('');
    expect(page().textContent).not.toContain('Välj en bild.');
  });

  it('removes the image', async () => {
    fixture.componentRef.setInput('product', {
      ...vase,
      image: { url: 'https://storage.test/vas.png', altText: 'En blå vas' },
    });
    await fixture.whenStable();
    // The test answers "OK" in the browser's "Are you sure?" dialog.
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Ta bort bilden').click();
    httpTesting
      .expectOne(
        (req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5/image'),
      )
      .flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(page().querySelector('img')).toBeNull();
    expect(page().textContent).toContain('Produkten har ingen bild än.');
  });

  function page(): HTMLElement {
    return fixture.nativeElement;
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  // Chooses a file the way a user does. A test cannot set input.files directly,
  // so the file list is replaced on this one input.
  async function choose(file: File): Promise<void> {
    const input = page().querySelector<HTMLInputElement>('#image-file')!;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function send(): Promise<void> {
    button('Ladda upp bilden').click();
    await fixture.whenStable();
  }

  // Lets the upload finish after the API has answered, like settle() in the product form's spec.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
});

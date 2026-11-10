import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProduct } from '../../../core/admin-product.service';
import { ConfirmService } from '../../../core/confirm.service';
import { ProductImage } from '../../../core/product-image';
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
    images: [],
    parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
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

  it('says when the product has no image', () => {
    expect(page().textContent).toContain('Produkten har ingen bild än.');
    expect(page().querySelector('ol')).toBeNull();
  });

  it('lists the images in order, with the first one as the main image', async () => {
    await showProduct(image(1), image(2));

    const rows = page().querySelectorAll('li');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Huvudbild');
    expect(rows[0].textContent).toContain('Bild 1');
    expect(rows[1].textContent).not.toContain('Huvudbild');
    expect(page().textContent).toContain('2 av 10 bilder.');
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

  it('adds the image last and empties the form', async () => {
    await showProduct(image(1));
    await choose(new File(['png'], 'vas.png', { type: 'image/png' }));
    type('#alt-text', 'Bild 2');

    await send();
    httpTesting
      .expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/admin/products/5/images'))
      .flush([image(1), image(2)]);
    await settle();

    const rows = page().querySelectorAll('li');
    expect(rows.length).toBe(2);
    expect(rows[1].querySelector('img')!.getAttribute('src')).toBe('https://storage.test/2.png');
    expect(rows[1].textContent).toContain('Bild 2');
    // The form is empty again, without showing "Välj en bild.".
    expect(page().querySelector<HTMLInputElement>('#alt-text')!.value).toBe('');
    expect(page().textContent).not.toContain('Välj en bild.');
  });

  it('replaces the form with a text at ten images, and moves the focus to the heading', async () => {
    const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(image);
    await showProduct(...nine);
    await choose(new File(['png'], 'vas.png', { type: 'image/png' }));
    type('#alt-text', 'Bild 10');

    await send();
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5/images'))
      .flush([...nine, image(10)]);
    await settle();

    expect(page().querySelector('form')).toBeNull();
    expect(page().textContent).toContain('Produkten har 10 bilder, som är det högsta antalet.');
    expect(document.activeElement).toBe(page().querySelector('h2'));
  });

  it('says so when the API answers that the product is already full', async () => {
    await choose(new File(['png'], 'vas.png', { type: 'image/png' }));
    type('#alt-text', 'En blå vas');

    await send();
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5/images'))
      .flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')!.textContent).toContain(
      'Produkten har redan 10 bilder.',
    );
  });

  it('removes the main image after asking, and moves the focus to the heading', async () => {
    await showProduct(image(1), image(2));
    // The test answers yes in the confirm dialog.
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);

    page().querySelector<HTMLButtonElement>('[aria-label="Ta bort bild 1"]')!.click();
    // Sent once the dialog's answer has arrived.
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5/images/1'),
      ),
    );
    request.flush([image(2)]);
    await settle();

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Nästa bild blir huvudbild och visas i butikens listor.',
      }),
    );
    const rows = page().querySelectorAll('li');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Huvudbild');
    expect(rows[0].textContent).toContain('Bild 2');
    expect(document.activeElement).toBe(page().querySelector('h2'));
  });

  it('moves an image up, says where it went and keeps the focus on its arrow', async () => {
    await showProduct(image(1), image(2), image(3));

    arrow('Flytta upp bild 3').click();
    const request = httpTesting.expectOne((req) =>
      req.url.endsWith('/api/admin/products/5/images/order'),
    );
    expect(request.request.body).toEqual({ imageIds: [1, 3, 2] });
    request.flush([image(1), image(3), image(2)]);
    await settle();

    expect(altTexts()).toEqual(['Bild 1', 'Bild 3', 'Bild 2']);
    expect(page().querySelector('[role="status"]')!.textContent).toBe(
      'Bilden är flyttad till plats 2 av 3.',
    );
    expect(document.activeElement).toBe(page().querySelector('#move-up-3'));
  });

  it('makes an image moved first the main image, with the focus on its other arrow', async () => {
    await showProduct(image(1), image(2));

    arrow('Flytta upp bild 2').click();
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5/images/order'))
      .flush([image(2), image(1)]);
    await settle();

    expect(page().querySelector('li')!.textContent).toContain('Huvudbild');
    expect(altTexts()).toEqual(['Bild 2', 'Bild 1']);
    expect(page().querySelector('[role="status"]')!.textContent).toContain('nu huvudbild');
    // Its up arrow is disabled at the top, so the focus goes to the down arrow.
    expect(document.activeElement).toBe(page().querySelector('#move-down-2'));
  });

  it("disables the first image's up arrow and the last one's down arrow", async () => {
    await showProduct(image(1), image(2));

    expect(arrow('Flytta upp bild 1').disabled).toBe(true);
    expect(arrow('Flytta ner bild 1').disabled).toBe(false);
    expect(arrow('Flytta upp bild 2').disabled).toBe(false);
    expect(arrow('Flytta ner bild 2').disabled).toBe(true);
  });

  it('has no arrows for a single image', async () => {
    await showProduct(image(1));

    expect(page().querySelector('[appIconButton]')).toBeNull();
  });

  it('keeps the order and says so when the move fails', async () => {
    await showProduct(image(1), image(2));

    arrow('Flytta ner bild 1').click();
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/5/images/order'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(altTexts()).toEqual(['Bild 1', 'Bild 2']);
    expect(page().querySelector('[role="alert"]')!.textContent).toContain(
      'Ordningen kunde inte ändras just nu.',
    );
  });

  it('on "Ny produkt", has no upload button and lets the image be left out', async () => {
    fixture.componentRef.setInput('product', undefined);
    await fixture.whenStable();
    const card = fixture.componentInstance;

    expect(button('Ladda upp bilden')).toBeUndefined();
    expect(card.pendingImage()).toBeNull();

    // A file needs its description, as when it is uploaded on its own.
    await choose(new File(['png'], 'vas.png', { type: 'image/png' }));
    expect(card.pendingImage()).toBe('invalid');
    await fixture.whenStable();
    expect(page().textContent).toContain('Beskriv bilden.');

    type('#alt-text', ' En blå vas ');
    expect(card.pendingImage()).toEqual({ file: expect.any(File), altText: 'En blå vas' });
  });

  function image(id: number): ProductImage {
    return { id, url: `https://storage.test/${id}.png`, altText: `Bild ${id}` };
  }

  async function showProduct(...images: ProductImage[]): Promise<void> {
    fixture.componentRef.setInput('product', { ...vase, images });
    await fixture.whenStable();
  }

  function page(): HTMLElement {
    return fixture.nativeElement;
  }

  function arrow(label: string): HTMLButtonElement {
    return page().querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  }

  function altTexts(): string[] {
    return [...page().querySelectorAll('.alt-text')].map((p) => p.textContent!.trim());
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

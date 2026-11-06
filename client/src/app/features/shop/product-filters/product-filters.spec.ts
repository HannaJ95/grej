import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProductFilters } from './product-filters';

describe('ProductFilters', () => {
  // Shows the filters for Keramik (1) with its subcategory Skålar (5), and Textil (2), at
  // /produkter?sida=2 plus the chosen ids. The boxes are in that order: Keramik, Skålar, Textil.
  async function render(selected: number[]) {
    TestBed.configureTestingModule({
      // children: [] is a route without a page, so the test can navigate to /produkter.
      providers: [provideRouter([{ path: 'produkter', children: [] }])],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(
      `/produkter?sida=2${selected.map((id) => `&kategori=${id}`).join('')}`,
    );
    const fixture = TestBed.createComponent(ProductFilters);
    fixture.componentRef.setInput('categories', [
      {
        id: 1,
        name: 'Keramik',
        productCount: 3,
        subcategories: [{ id: 5, name: 'Skålar', productCount: 1, subcategories: [] }],
      },
      { id: 2, name: 'Textil', productCount: 2, subcategories: [] },
    ]);
    fixture.componentRef.setInput('selected', selected);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const boxes = [...element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    return { fixture, router, element, boxes };
  }

  it('ticks the chosen categories and adds a new one to the URL, from page 1', async () => {
    const { fixture, router, boxes } = await render([1]);
    expect(boxes.map((box) => box.checked)).toEqual([true, false, false]);

    boxes[2].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1&kategori=2');
  });

  it('removes an unticked category, and Rensa removes them all', async () => {
    const { fixture, router, element, boxes } = await render([1, 2]);

    boxes[0].click();
    await fixture.whenStable();
    expect(router.url).toBe('/produkter?kategori=2');

    element.querySelector<HTMLButtonElement>('.clear')!.click();
    await fixture.whenStable();
    expect(router.url).toBe('/produkter');
  });

  it("shows a subcategory inside its main category's row, and ticks it on its own", async () => {
    const { fixture, router, element, boxes } = await render([]);
    const skalar = boxes[1];

    // The subcategory's list is inside Keramik's row.
    expect(skalar.closest('ul.subcategories')?.closest('li')?.textContent).toContain('Keramik');
    expect(element.querySelector('.subcategories .name')?.textContent?.trim()).toBe('Skålar');

    skalar.click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=5');
  });

  it('shows Rensa only when a category is chosen', async () => {
    const { element } = await render([]);

    expect(element.querySelector('.clear')).toBeNull();
  });

  it('folds the list of categories with the button in the heading', async () => {
    const { fixture, element } = await render([]);
    const fold = element.querySelector<HTMLButtonElement>('.fold')!;
    expect(fold.getAttribute('aria-expanded')).toBe('true');

    fold.click();
    await fixture.whenStable();

    expect(fold.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('input')).toBeNull();
  });
});

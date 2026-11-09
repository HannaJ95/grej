import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_FILTER, ProductFilter, toQueryParams } from '../../../core/product-filter';
import { ShopProperty } from '../../../core/product-property';
import { ProductFilters } from './product-filters';

describe('ProductFilters', () => {
  // Keramik (1) with its subcategory Skålar (5), Textil (2), the material Lera (4) and the color
  // Blå (6), at /produkter?sida=2 plus the chosen filter. The boxes are in that order, Skålar only
  // when Keramik is chosen.
  async function render(
    choices: Partial<ProductFilter> = {},
    {
      colors = [{ id: 6, name: 'Blå', productCount: 3 }],
      highestPrice,
    }: { colors?: ShopProperty[]; highestPrice?: number | null } = {},
  ) {
    const filter = { ...NO_FILTER, ...choices };
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'produkter', children: [] }])],
    });
    const router = TestBed.inject(Router);
    await router.navigate(['/produkter'], { queryParams: { sida: 2, ...toQueryParams(filter) } });
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
    fixture.componentRef.setInput('materials', [{ id: 4, name: 'Lera', productCount: 2 }]);
    fixture.componentRef.setInput('colors', colors);
    fixture.componentRef.setInput('filter', filter);
    fixture.componentRef.setInput('highestPrice', highestPrice);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const boxes = [...element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    return { fixture, router, element, boxes };
  }

  function headings(element: HTMLElement): string[] {
    return [...element.querySelectorAll('h3')].map((h3) => h3.textContent!.trim());
  }

  // The button in a group's heading, which folds the group.
  function fold(element: HTMLElement, heading: string): HTMLButtonElement {
    return [...element.querySelectorAll<HTMLButtonElement>('h3 button')].find(
      (button) => button.textContent!.trim() === heading,
    )!;
  }

  it('ticks the chosen categories and adds a new one to the URL, from page 1', async () => {
    const { fixture, router, boxes } = await render({ categoryIds: [1] });
    expect(boxes.map((box) => box.checked)).toEqual([true, false, false, false, false]);

    boxes[2].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1&kategori=2');
  });

  it('removes an unticked category and keeps the other choices', async () => {
    const { fixture, router, boxes } = await render({ categoryIds: [1, 2], colorIds: [6] });

    boxes[0].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=2&farg=6');
  });

  it('folds Material and Färg until something in them is chosen', async () => {
    const { element } = await render({ colorIds: [6] });

    expect(fold(element, 'Kategori').getAttribute('aria-expanded')).toBe('true');
    expect(fold(element, 'Material').getAttribute('aria-expanded')).toBe('false');
    expect(fold(element, 'Färg').getAttribute('aria-expanded')).toBe('true');
  });

  it('adds a material to the URL next to the other choices', async () => {
    const { fixture, router, element, boxes } = await render({ categoryIds: [1], maxPrice: 500 });
    fold(element, 'Material').click();
    await fixture.whenStable();

    boxes[3].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1&maxpris=500&material=4');
  });

  it('shows the subcategories, one size smaller, only inside a ticked main category', async () => {
    expect((await render()).element.querySelector('.subcategories')).toBeNull();

    TestBed.resetTestingModule();
    const { fixture, router, element, boxes } = await render({ categoryIds: [1] });
    const skalar = boxes[1];
    const name = element.querySelector('.subcategories .name')!;

    expect(skalar.closest('ul.subcategories')!.closest('li')!.textContent).toContain('Keramik');
    expect(name.textContent!.trim()).toBe('Skålar');
    expect(name.classList).toContain('text-body-s');

    skalar.click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1&kategori=5');
  });

  it('unticks the subcategories too when their main category is unticked', async () => {
    const { fixture, router, boxes } = await render({ categoryIds: [1, 5, 2] });

    boxes[0].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=2');
  });

  it('keeps the main category ticked when its last subcategory is unticked', async () => {
    const { fixture, router, boxes } = await render({ categoryIds: [1, 5] });

    boxes[1].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1');
  });

  it('puts the search in the URL from page 1, next to the other choices', async () => {
    const { fixture, router, element } = await render({ categoryIds: [1] });
    const field = element.querySelector<HTMLInputElement>('input[type="search"]')!;

    field.value = 'vas';
    field.dispatchEvent(new Event('change'));
    // Chrome's own event on Enter, which must not reach the filter.
    field.dispatchEvent(new Event('search', { bubbles: true }));
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1&sok=vas');
  });

  it('shows Rensa only when something is chosen, and Rensa removes every choice', async () => {
    expect((await render()).element.querySelector('.clear')).toBeNull();

    TestBed.resetTestingModule();
    const { fixture, router, element } = await render({
      categoryIds: [1],
      materialIds: [4],
      colorIds: [6],
      minPrice: 100,
      search: 'vas',
    });
    element.querySelector<HTMLButtonElement>('.clear')!.click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter');
  });

  it('leaves out a group without choices', async () => {
    const { element } = await render({}, { colors: [], highestPrice: null });

    expect(headings(element)).toEqual(['Kategori', 'Material']);
  });

  it('shows Pris up to the highest price rounded up, and puts the chosen price in the URL', async () => {
    const { fixture, router, element } = await render({ categoryIds: [1] }, { highestPrice: 4321 });
    expect(headings(element)).toEqual(['Kategori', 'Pris', 'Material', 'Färg']);
    const lowThumb = element.querySelector<HTMLInputElement>('input[type="range"]')!;
    expect(lowThumb.max).toBe('4400');

    lowThumb.value = '200';
    lowThumb.dispatchEvent(new Event('input'));
    lowThumb.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?kategori=1&minpris=200');
  });
});

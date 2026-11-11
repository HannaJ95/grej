import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProductSort } from '../../../core/product-sort';
import { SortSelect } from './sort-select';

describe('SortSelect', () => {
  // At /produkter?sida=2&kategori=1&sortera=…, with that sort chosen.
  async function render(sort: ProductSort) {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'produkter', children: [] }])],
    });
    const router = TestBed.inject(Router);
    const sortera = sort === 'nyast' ? undefined : sort;
    await router.navigate(['/produkter'], { queryParams: { sida: 2, kategori: 1, sortera } });
    const fixture = TestBed.createComponent(SortSelect);
    fixture.componentRef.setInput('sort', sort);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const select = element.querySelector('select')!;
    return { fixture, router, element, select };
  }

  async function choose(fixture: ComponentFixture<SortSelect>, select: HTMLSelectElement, value: string) {
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  it('shows the three orders with the current one chosen, named Sortera', async () => {
    const { select } = await render('hogst-pris');

    expect([...select.options].map((option) => option.textContent!.trim())).toEqual([
      'Nyast först',
      'Lägst pris',
      'Högst pris',
    ]);
    expect(select.value).toBe('hogst-pris');
    expect(select.getAttribute('aria-label')).toBe('Sortera');
  });

  it('puts the chosen order in the URL, keeps the filter and starts on page 1', async () => {
    const { fixture, router, select } = await render('nyast');

    await choose(fixture, select, 'lagst-pris');

    expect(router.url).toBe('/produkter?kategori=1&sortera=lagst-pris');
  });

  it('leaves the newest first out of the URL', async () => {
    const { fixture, router, select } = await render('lagst-pris');

    await choose(fixture, select, 'nyast');

    expect(router.url).toBe('/produkter?kategori=1');
  });

  describe('a click on "Sortera:"', () => {
    // jsdom has no picker, so showPicker is a spy and :open is set by hand.
    function clickPrefix(element: HTMLElement, select: HTMLSelectElement, open: boolean) {
      vi.spyOn(select, 'matches').mockReturnValue(open);
      const showPicker = vi.fn();
      select.showPicker = showPicker;
      const prefix = element.querySelector('.prefix')!;
      prefix.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      prefix.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return showPicker;
    }

    it('opens the list', async () => {
      const { element, select } = await render('nyast');

      expect(clickPrefix(element, select, false)).toHaveBeenCalledOnce();
    });

    it('only closes the list when it was open', async () => {
      const { element, select } = await render('nyast');

      expect(clickPrefix(element, select, true)).not.toHaveBeenCalled();
    });
  });

  it('opens the list with Enter, but leaves Enter on an option to choose it', async () => {
    const { select } = await render('nyast');
    const showPicker = vi.fn();
    select.showPicker = showPicker;

    select.options[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(showPicker).not.toHaveBeenCalled();

    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(showPicker).toHaveBeenCalledOnce();
  });
});

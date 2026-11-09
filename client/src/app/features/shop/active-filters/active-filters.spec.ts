import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_FILTER } from '../../../core/product-filter';
import { ActiveFilters } from './active-filters';
import { FilterChip } from './filter-chips';

describe('ActiveFilters', () => {
  // At /produkter?sida=2&kategori=1&farg=6, with a chip for each of them.
  async function render(inputs: { clearAll?: boolean } = {}) {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'produkter', children: [] }])],
    });
    const router = TestBed.inject(Router);
    await router.navigate(['/produkter'], { queryParams: { sida: 2, kategori: 1, farg: 6 } });
    const chips: FilterChip[] = [
      { key: 'categoryIds-1', label: 'Keramik', without: { ...NO_FILTER, colorIds: [6] } },
      { key: 'colorIds-6', label: 'Blå', without: { ...NO_FILTER, categoryIds: [1] } },
    ];
    const fixture = TestBed.createComponent(ActiveFilters);
    fixture.componentRef.setInput('chips', chips);
    if (inputs.clearAll !== undefined) {
      fixture.componentRef.setInput('clearAll', inputs.clearAll);
    }
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    // Attached, so focus() works.
    document.body.appendChild(element);
    const buttons = [...element.querySelectorAll<HTMLButtonElement>('.chip')];
    return { fixture, router, element, buttons };
  }

  afterEach(() => document.body.replaceChildren());

  it('names what each chip removes', async () => {
    const { buttons } = await render();

    expect(buttons.map((button) => button.textContent!.trim())).toEqual(['Keramik', 'Blå']);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Ta bort Keramik',
      'Ta bort Blå',
    ]);
  });

  it('removes one choice from page 1, and moves the focus to the chip beside it', async () => {
    const { fixture, router, buttons } = await render();

    buttons[0].click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter?farg=6');
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('removes every choice with Rensa alla, which can be left out', async () => {
    const { fixture, router, element } = await render();

    element.querySelector<HTMLButtonElement>('[appLinkButton]')!.click();
    await fixture.whenStable();
    expect(router.url).toBe('/produkter');

    TestBed.resetTestingModule();
    const { element: withoutClear } = await render({ clearAll: false });
    expect(withoutClear.querySelector('[appLinkButton]')).toBeNull();
  });
});

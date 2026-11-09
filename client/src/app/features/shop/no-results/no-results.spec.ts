import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_FILTER } from '../../../core/product-filter';
import { FilterChip } from '../active-filters/filter-chips';
import { NoResults } from './no-results';

describe('NoResults', () => {
  const keramik: FilterChip = { key: 'categoryIds-1', label: 'Keramik', without: NO_FILTER };
  const bla: FilterChip = { key: 'colorIds-6', label: 'Blå', without: NO_FILTER };
  const price: FilterChip = { key: 'price', label: 'Max 150 kr', without: NO_FILTER };

  async function render(chips: FilterChip[]) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'produkter', children: [] }]),
        { provide: LOCALE_ID, useValue: 'sv' },
      ],
    });
    const router = TestBed.inject(Router);
    await router.navigate(['/produkter'], { queryParams: { kategori: 1, farg: 6 } });
    const fixture = TestBed.createComponent(NoResults);
    fixture.componentRef.setInput('chips', chips);
    let cleared = 0;
    fixture.componentInstance.cleared.subscribe(() => cleared++);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    return { fixture, router, element, cleared: () => cleared };
  }

  function text(element: Element): string {
    return element.textContent!.replace(/\s+/g, ' ').trim();
  }

  it('says what was chosen, with the price in lower case and a tip about it', async () => {
    const { element } = await render([keramik, bla, price]);

    expect(element.querySelector('h2')!.textContent).toBe('Inga grejer hittades');
    expect(text(element.querySelector('p')!)).toBe(
      'Vi hittade inget som matchar Keramik, Blå och max 150 kr. Prova att ta bort ett filter eller vidga prisintervallet.',
    );
  });

  it('shows the chips one by one only when there is more than one choice', async () => {
    const one = await render([keramik]);
    expect(text(one.element.querySelector('p')!)).toBe(
      'Vi hittade inget som matchar Keramik. Prova att ta bort ett filter.',
    );
    expect(one.element.querySelector('app-active-filters')).toBeNull();

    TestBed.resetTestingModule();
    const two = await render([keramik, bla]);
    const chips = [...two.element.querySelectorAll('.chip')].map((chip) => text(chip));
    expect(chips).toEqual(['Keramik', 'Blå']);
    expect(two.element.querySelector('[appLinkButton]')).toBeNull();
  });

  it('removes every choice with Rensa alla filter and tells the list', async () => {
    const { fixture, router, element, cleared } = await render([keramik, bla]);

    element.querySelector<HTMLButtonElement>('button[appButton]')!.click();
    await fixture.whenStable();

    expect(router.url).toBe('/produkter');
    expect(cleared()).toBe(1);
  });
});

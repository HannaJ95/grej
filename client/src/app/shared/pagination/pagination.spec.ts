import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Pagination } from './pagination';

describe('Pagination', () => {
  // Shows the pagination of the list at /produkter, on page `page` of `totalPages`,
  // while the browser is at `url`.
  async function show(
    page: number,
    totalPages: number,
    url = '/',
    fragment?: string,
  ): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('path', '/produkter');
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.componentRef.setInput('fragment', fragment);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  // The text and address of the links to the page before and after.
  function links(element: HTMLElement): string[][] {
    return [...element.querySelectorAll('a.step')].map((a) => [
      a.textContent!.trim(),
      a.getAttribute('href')!,
    ]);
  }

  it('shows nothing when the whole list fits on one page', async () => {
    const element = await show(1, 1);
    expect(element.querySelector('nav')).toBeNull();
  });

  it('links to the pages before and after', async () => {
    const element = await show(2, 3);
    expect(links(element)).toEqual([
      ['Föregående', '/produkter?sida=1'],
      ['Nästa', '/produkter?sida=3'],
    ]);
    expect(element.querySelector('[aria-current="page"]')!.textContent!.trim()).toBe('Sida 2');
  });

  // The page numbers on a computer, or on a phone (compact), with … where pages are left out.
  function numbers(element: HTMLElement, compact = false): string[] {
    const list = element.querySelector(compact ? '.pages.compact' : '.pages:not(.compact)')!;
    return [...list.querySelectorAll('li')].map((li) => li.textContent!.replace('Sida', '').trim());
  }

  it('numbers the pages, with fewer on a phone', async () => {
    expect(numbers(await show(1, 8))).toEqual(['1', '2', '3', '…', '8']);
  });

  it('shows the pages next to the current one in the middle', async () => {
    const element = await show(5, 8);
    expect(numbers(element)).toEqual(['1', '…', '4', '5', '6', '…', '8']);
    expect(numbers(element, true)).toEqual(['1', '…', '5', '…', '8']);
  });

  it('links each number to its page', async () => {
    const element = await show(1, 3);
    const hrefs = [...element.querySelectorAll('.pages:not(.compact) a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/produkter?sida=2', '/produkter?sida=3']);
  });

  it('has no link before the first page', async () => {
    expect(links(await show(1, 2))).toEqual([['Nästa', '/produkter?sida=2']]);
  });

  it('has no link after the last page', async () => {
    expect(links(await show(2, 2))).toEqual([['Föregående', '/produkter?sida=1']]);
  });

  it("keeps the list's other query parameters, e.g. a filter", async () => {
    expect(links(await show(1, 2, '/?visa=alla'))).toEqual([
      ['Nästa', '/produkter?visa=alla&sida=2'],
    ]);
  });

  it('leads every link to the fragment when it has one', async () => {
    const element = await show(2, 3, '/', 'grejer');
    expect(links(element)).toEqual([
      ['Föregående', '/produkter?sida=1#grejer'],
      ['Nästa', '/produkter?sida=3#grejer'],
    ]);
    const hrefs = [...element.querySelectorAll('.pages:not(.compact) a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/produkter?sida=1#grejer', '/produkter?sida=3#grejer']);
  });
});

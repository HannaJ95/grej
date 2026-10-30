import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pagination } from './pagination';

describe('Pagination', () => {
  // Shows the pagination of the list at /produkter, on page `page` of `totalPages`.
  async function show(page: number, totalPages: number): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('path', '/produkter');
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  // The text and address of each link.
  function links(element: HTMLElement): string[][] {
    return [...element.querySelectorAll('a')].map((a) => [
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
    expect(element.textContent).toContain('Sida 2 av 3');
  });

  it('has no link before the first page', async () => {
    expect(links(await show(1, 2))).toEqual([['Nästa', '/produkter?sida=2']]);
  });

  it('has no link after the last page', async () => {
    expect(links(await show(2, 2))).toEqual([['Föregående', '/produkter?sida=1']]);
  });
});

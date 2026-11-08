import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CategoryTabs } from './category-tabs';

describe('CategoryTabs', () => {
  async function render(selected: number[], url = '/'): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'produkter', children: [] }])],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(CategoryTabs);
    fixture.componentRef.setInput('categories', [
      { id: 1, name: 'Keramik', productCount: 3, subcategories: [] },
      { id: 2, name: 'Textil', productCount: 2, subcategories: [] },
    ]);
    fixture.componentRef.setInput('selected', selected);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  // The text of the chosen tab, or null if no tab is chosen.
  function chosen(element: HTMLElement): string | null {
    return element.querySelector('[aria-current="page"]')?.textContent?.trim() ?? null;
  }

  function hrefs(element: HTMLElement): (string | null)[] {
    return [...element.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  }

  it('links each tab to its category, and Alla to all with the sum of the products', async () => {
    const element = await render([]);

    const tabs = [...element.querySelectorAll('a')].map((a) => [
      a.textContent!.replace(/\s+/g, ' ').trim(),
      a.getAttribute('href'),
    ]);
    expect(tabs).toEqual([
      ['Alla 5', '/produkter'],
      ['Keramik 3', '/produkter?kategori=1'],
      ['Textil 2', '/produkter?kategori=2'],
    ]);
    expect(chosen(element)).toContain('Alla');
  });

  it('marks a tab as chosen only when exactly its category is chosen', async () => {
    expect(chosen(await render([2]))).toContain('Textil');

    TestBed.resetTestingModule();
    expect(chosen(await render([1, 2]))).toBeNull();
  });

  it('keeps the other filters and starts on page 1', async () => {
    const element = await render([1, 2], '/produkter?farg=2&sida=3&kategori=1&kategori=2');

    expect(hrefs(element)).toEqual([
      '/produkter?farg=2',
      '/produkter?farg=2&kategori=1',
      '/produkter?farg=2&kategori=2',
    ]);
  });
});

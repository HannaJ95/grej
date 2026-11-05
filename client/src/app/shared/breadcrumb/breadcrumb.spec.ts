import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Breadcrumb } from './breadcrumb';

describe('Breadcrumb', () => {
  it('links to the pages above and marks the current one', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Breadcrumb);
    fixture.componentRef.setInput('links', [
      { label: 'Hem', path: '/' },
      { label: 'Shop', path: '/produkter' },
    ]);
    fixture.componentRef.setInput('current', 'Vas');
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const links = [...element.querySelectorAll('a')].map((a) => [
      a.textContent,
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['Hem', '/'],
      ['Shop', '/produkter'],
    ]);
    expect(element.querySelector('[aria-current="page"]')!.textContent).toBe('Vas');
  });
});

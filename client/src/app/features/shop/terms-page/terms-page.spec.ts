import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsPage } from './terms-page';

describe('TermsPage', () => {
  async function show(): Promise<ComponentFixture<TermsPage>> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TermsPage);
    await fixture.whenStable();
    return fixture;
  }

  const text = (node: Element | null) => node?.textContent?.replace(/\s+/g, ' ').trim();

  it('has one main heading and the date it was updated', async () => {
    const element: HTMLElement = (await show()).nativeElement;

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('.updated time')?.getAttribute('datetime')).toBe('2026-11-12');
  });

  it('links each item in Innehåll to its numbered heading', async () => {
    const element: HTMLElement = (await show()).nativeElement;

    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('app-terms-contents a'));
    expect(links.length).toBe(10);

    links.forEach((link, index) => {
      const id = link.getAttribute('href')?.split('#')[1];
      expect(link.getAttribute('href')).toBe(`/villkor#${id}`);
      expect(text(link)).toMatch(new RegExp(`^${index + 1}\\. `));
      expect(text(element.querySelector(`h2#${id}`))).toBe(text(link));
    });
  });

  it('marks the section whose heading has scrolled up to the top', async () => {
    const fixture = await show();
    const element: HTMLElement = fixture.nativeElement;
    const current = () => text(element.querySelector('app-terms-contents [aria-current]'));
    expect(current()).toBe('1. Vem som säljer');

    // The first three headings have scrolled past the top, the others are further down.
    element.querySelectorAll('h2[tabindex]').forEach((heading, index) => {
      vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue({
        top: index < 3 ? -100 : 500,
      } as DOMRect);
    });
    window.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(current()).toBe('3. Frakt');
  });
});

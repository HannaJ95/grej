import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsPage } from './terms-page';

describe('TermsPage', () => {
  async function show(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TermsPage);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('has one main heading and the date it was updated', async () => {
    const element = await show();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('.updated time')?.getAttribute('datetime')).toBe('2026-11-12');
  });

  it('links each item in Innehåll to its numbered heading', async () => {
    const element = await show();

    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.contents-list a'));
    expect(links.length).toBe(10);

    links.forEach((link, index) => {
      const id = link.getAttribute('href')?.split('#')[1];
      expect(link.getAttribute('href')).toBe(`/villkor#${id}`);

      const heading = element.querySelector(`h2#${id}`);
      expect(heading?.textContent?.trim()).toBe(`${index + 1}. ${link.textContent?.trim()}`);
    });
  });
});

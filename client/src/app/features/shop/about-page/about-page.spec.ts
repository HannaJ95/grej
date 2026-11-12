import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutPage } from './about-page';

describe('AboutPage', () => {
  async function show(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AboutPage);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('has one main heading and three values', async () => {
    const element = await show();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelectorAll('.value-list li').length).toBe(3);
  });

  it('links to the products', async () => {
    const element = await show();

    const link = element.querySelector('a.shop-link');
    expect(link?.getAttribute('href')).toBe('/produkter');
  });
});

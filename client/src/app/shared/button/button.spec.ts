import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { Button } from './button';

// A small page that uses the button the same ways as the app does.
@Component({
  imports: [Button, RouterLink],
  template: `
    <button appButton type="submit">Spara</button>
    <button appButton variant="secondary" type="button">Stäng</button>
    <button appButton variant="danger" type="button">Ta bort</button>
    <a appButton routerLink="/admin/produkter/ny">Ny produkt</a>
    <button appButton variant="secondary" size="large" type="button">Fortsätt handla</button>
  `,
})
class TestPage {}

describe('Button', () => {
  let page: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TestPage);
    await fixture.whenStable();
    page = fixture.nativeElement;
  });

  it('gives each variant its class and keeps the text', () => {
    const [save, close, remove] = page.querySelectorAll('button');
    expect(save.textContent).toBe('Spara');
    // Primary is the default and needs no class.
    expect([...save.classList]).toEqual([]);
    expect([...close.classList]).toEqual(['secondary']);
    expect([...remove.classList]).toEqual(['danger']);
  });

  it('gives the large size its class together with the variant', () => {
    const large = page.querySelectorAll('button')[3];
    expect([...large.classList]).toEqual(['secondary', 'large']);
  });

  it('works on a link with routerLink', () => {
    const link = page.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/admin/produkter/ny');
    expect(link.textContent).toBe('Ny produkt');
  });
});

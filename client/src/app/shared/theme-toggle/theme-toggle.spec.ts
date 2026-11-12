import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';

@Component({
  imports: [ThemeToggle],
  template: `
    <button appThemeToggle class="icon-only"></button>
    <button appThemeToggle showLabel class="with-label"></button>
  `,
})
class Host {}

describe('ThemeToggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset['theme'];
    localStorage.clear();
  });

  it('offers "Mörkt läge" by its aria-label or its text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const iconOnly = element.querySelector('.icon-only')!;
    const withLabel = element.querySelector('.with-label')!;
    expect(iconOnly.getAttribute('aria-label')).toBe('Mörkt läge');
    expect(withLabel.getAttribute('aria-label')).toBeNull();
    expect(withLabel.textContent!.trim()).toBe('Mörkt läge');
  });

  it('turns dark mode on and then offers "Ljust läge" with the sun', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const iconOnly = element.querySelector<HTMLButtonElement>('.icon-only')!;
    expect(iconOnly.querySelector('app-icon')!.getAttribute('style')).toContain('moon.svg');

    iconOnly.click();
    await fixture.whenStable();

    expect(iconOnly.getAttribute('aria-label')).toBe('Ljust läge');
    expect(iconOnly.querySelector('app-icon')!.getAttribute('style')).toContain('sun.svg');
    expect(iconOnly.hasAttribute('aria-pressed')).toBe(false);
    // Both buttons read the same service.
    expect(element.querySelector('.with-label')!.textContent!.trim()).toBe('Ljust läge');
  });
});

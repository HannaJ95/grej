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

  it('is named "Mörkt läge" by its aria-label or its text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const iconOnly = element.querySelector('.icon-only')!;
    const withLabel = element.querySelector('.with-label')!;
    expect(iconOnly.getAttribute('aria-label')).toBe('Mörkt läge');
    expect(withLabel.getAttribute('aria-label')).toBeNull();
    expect(withLabel.textContent!.trim()).toBe('Mörkt läge');
  });

  it('turns dark mode on and shows the sun', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector<HTMLButtonElement>('.icon-only')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.querySelector('app-icon')!.getAttribute('style')).toContain('moon.svg');

    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('app-icon')!.getAttribute('style')).toContain('sun.svg');
    // Both buttons read the same service.
    expect(element.querySelector('.with-label')!.getAttribute('aria-pressed')).toBe('true');
  });
});

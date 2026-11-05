import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconButton } from './icon-button';

// A small page with the two tones, like the cart (dark) and the menu (light).
@Component({
  imports: [IconButton],
  template: `
    <button appIconButton icon="close" aria-label="Stäng" type="button"></button>
    <button appIconButton icon="close" tone="light" aria-label="Stäng" type="button"></button>
  `,
})
class TestPage {}

describe('IconButton', () => {
  it('shows the icon and gives the light tone its class', async () => {
    const fixture = TestBed.createComponent(TestPage);
    await fixture.whenStable();
    const [dark, light] = fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[];

    expect(dark.querySelector('app-icon')!.getAttribute('style')).toContain('/icons/close.svg');
    expect(dark.classList.contains('light')).toBe(false);
    expect(light.classList.contains('light')).toBe(true);
    expect(light.getAttribute('aria-label')).toBe('Stäng');
  });
});

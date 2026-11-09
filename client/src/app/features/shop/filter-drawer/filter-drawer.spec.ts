import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterDrawer } from './filter-drawer';

@Component({
  imports: [FilterDrawer],
  template: `
    <app-filter-drawer #drawer [choices]="choices()" [resultCount]="count()">
      <button class="close" type="button" (click)="drawer.close()">Stäng</button>
    </app-filter-drawer>
  `,
})
class Host {
  readonly choices = signal(0);
  readonly count = signal<number | undefined>(undefined);
}

describe('FilterDrawer', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    // jsdom has no showModal or close, so they only set and remove open.
    const dialog = element.querySelector('dialog')!;
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
    return { fixture, element, dialog };
  }

  function text(element: Element): string {
    return element.textContent!.replace(/\s+/g, ' ').trim();
  }

  it('shows the number of choices in a square on the button, and opens the panel with it', async () => {
    const { fixture, element, dialog } = await render();
    const open = element.querySelector<HTMLButtonElement>('.open-button')!;
    expect(text(open)).toBe('Filter');
    expect(open.querySelector('app-button-count')).toBeNull();
    expect(open.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.choices.set(3);
    await fixture.whenStable();
    expect(open.querySelector('app-button-count')!.textContent).toBe('3');
    expect(open.getAttribute('aria-label')).toBe('Filter, 3 valda');

    open.click();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('shows the number of products, and closes from the projected button and Visa', async () => {
    const { fixture, element, dialog } = await render();
    const show = element.querySelector<HTMLButtonElement>('.show')!;
    expect(text(show)).toBe('Visa grejerna');

    fixture.componentInstance.count.set(1);
    await fixture.whenStable();
    expect(text(show)).toBe('Visa 1 grej');

    fixture.componentInstance.count.set(24);
    await fixture.whenStable();
    expect(text(show)).toBe('Visa 24 grejer');

    dialog.showModal();
    element.querySelector<HTMLButtonElement>('.close')!.click();
    expect(dialog.hasAttribute('open')).toBe(false);

    dialog.showModal();
    show.click();
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});

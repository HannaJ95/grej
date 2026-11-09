import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterGroup } from './filter-group';

@Component({
  imports: [FilterGroup],
  template: `
    <app-filter-group heading="Material"><p>Lera</p></app-filter-group>
    <app-filter-group heading="Färg" [startOpen]="colorsOpen()"><p>Blå</p></app-filter-group>
  `,
})
class TwoGroups {
  readonly colorsOpen = signal(false);
}

describe('FilterGroup', () => {
  async function render() {
    const fixture = TestBed.createComponent(TwoGroups);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const groups = [...element.querySelectorAll<HTMLElement>('app-filter-group')];
    return { fixture, groups };
  }

  it('folds its content with the button in the heading', async () => {
    const { fixture, groups } = await render();
    const fold = groups[0].querySelector('button')!;
    const content = groups[0].querySelector<HTMLElement>('[role="group"]')!;
    expect(fold.getAttribute('aria-expanded')).toBe('true');
    expect(content.hasAttribute('inert')).toBe(false);

    fold.click();
    await fixture.whenStable();

    expect(fold.getAttribute('aria-expanded')).toBe('false');
    expect(content.hasAttribute('inert')).toBe(true);
  });

  it('starts folded when startOpen is false, and never changes by itself after that', async () => {
    const { fixture, groups } = await render();
    const fold = groups[1].querySelector('button')!;
    expect(fold.getAttribute('aria-expanded')).toBe('false');

    fixture.componentInstance.colorsOpen.set(true);
    await fixture.whenStable();
    expect(fold.getAttribute('aria-expanded')).toBe('false');

    fold.click();
    await fixture.whenStable();
    expect(fold.getAttribute('aria-expanded')).toBe('true');
  });

  it('gives each group ids of its own, which the button and the content point at', async () => {
    const { groups } = await render();

    const ids = groups.map((group) => {
      const heading = group.querySelector('h3')!;
      const content = group.querySelector('[role="group"]')!;
      expect(group.querySelector('button')!.getAttribute('aria-controls')).toBe(content.id);
      expect(content.getAttribute('aria-labelledby')).toBe(heading.id);
      return content.id;
    });

    expect(new Set(ids).size).toBe(2);
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfoTip } from './info-tip';

@Component({
  imports: [InfoTip],
  template: `
    <app-info-tip label="Vad är alt-text?"><p>En kort beskrivning.</p></app-info-tip>
    <app-info-tip label="Vad är en till?"><p>En till.</p></app-info-tip>
  `,
})
class Host {}

describe('InfoTip', () => {
  it('names the button and connects it to its own box with the text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const [first, second] = element.querySelectorAll('app-info-tip');
    const button = first.querySelector('button')!;
    const tip = first.querySelector('[popover]')!;

    expect(button.getAttribute('aria-label')).toBe('Vad är alt-text?');
    expect(button.getAttribute('popovertarget')).toBe(tip.id);
    expect(tip.textContent).toContain('En kort beskrivning.');
    // Two on one page never open each other's box.
    expect(second.querySelector('[popover]')!.id).not.toBe(tip.id);
  });
});

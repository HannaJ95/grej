import { TestBed } from '@angular/core/testing';
import { ButtonCount } from './button-count';

describe('ButtonCount', () => {
  it('shows the number, dark unless the tone is light', async () => {
    const fixture = TestBed.createComponent(ButtonCount);
    fixture.componentRef.setInput('count', 3);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toBe('3');
    expect(element.classList).not.toContain('light');

    fixture.componentRef.setInput('tone', 'light');
    await fixture.whenStable();
    expect(element.classList).toContain('light');
  });
});

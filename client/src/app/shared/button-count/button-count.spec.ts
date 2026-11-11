import { TestBed } from '@angular/core/testing';
import { ButtonCount } from './button-count';

describe('ButtonCount', () => {
  it('shows the number', async () => {
    const fixture = TestBed.createComponent(ButtonCount);
    fixture.componentRef.setInput('count', 3);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toBe('3');
  });
});

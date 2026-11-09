import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../core/toast.service';
import { Toast } from './toast';

describe('Toast', () => {
  let fixture: ComponentFixture<Toast>;
  let toast: ToastService;

  beforeEach(() => {
    // Fake timers, so the test can move time forward instead of waiting 5 seconds.
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Toast);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('shows the message and hides it after 5 seconds', () => {
    show('Ändringarna är sparade.');

    vi.advanceTimersByTime(4999);
    fixture.detectChanges();
    expect(text()).toBe('Ändringarna är sparade.');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(text()).toBeUndefined();
  });

  it('waits while the pointer is on it, and closes with the cross', () => {
    show('Bilden är uppladdad.');

    box().dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(text()).toBe('Bilden är uppladdad.');

    box().querySelector<HTMLButtonElement>('[aria-label="Stäng"]')!.click();
    fixture.detectChanges();
    expect(text()).toBeUndefined();
  });

  it('is in a live region, so screen readers read it without it taking the focus', () => {
    show('Lera har tagits bort.');

    expect(box().closest('[aria-live="polite"]')).not.toBeNull();
    expect(document.activeElement).not.toBe(box().querySelector('button'));
  });

  function show(message: string): void {
    toast.show(message);
    fixture.detectChanges();
  }

  function box(): HTMLElement {
    return fixture.nativeElement.querySelector('.toast');
  }

  function text(): string | undefined {
    return fixture.nativeElement.querySelector('.text')?.textContent ?? undefined;
  }
});

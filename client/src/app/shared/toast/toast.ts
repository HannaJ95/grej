import { Component, DestroyRef, effect, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { IconButton } from '../icon-button/icon-button';
import { Icon } from '../icons/icon';

const SHOW_FOR_MS = 5000;

// Shows ToastService's message in the bottom corner. The same rules as AddedToCart in the shop:
// it closes by itself, with the cross or with Escape, pauses while the pointer or the focus is
// on it, never takes the focus, and screen readers hear it through aria-live.
@Component({
  selector: 'app-toast',
  imports: [Icon, IconButton],
  host: {
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <!-- Always in the page, so screen readers notice when a message appears. -->
    <div aria-live="polite">
      @if (toast.current(); as current) {
        <div
          class="toast"
          (mouseenter)="pause()"
          (mouseleave)="startTimer()"
          (focusin)="pause()"
          (focusout)="startTimer()"
        >
          <span class="check" aria-hidden="true"><app-icon name="check" /></span>
          <p class="text text-body-s">{{ current.text }}</p>
          <button appIconButton icon="close" type="button" aria-label="Stäng" (click)="close()"></button>
        </div>
      }
    </div>
  `,
  styles: `
    // Fixed in the bottom corner, so it never covers a page's button in the top bar.
    .toast {
      position: fixed;
      right: var(--layout-admin-gutter);
      bottom: var(--space-24);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: var(--space-12);
      width: min(24rem, 100% - 2 * var(--layout-admin-gutter));
      padding: var(--space-12) var(--space-12) var(--space-12) var(--space-16);
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
      box-shadow: var(--shadow-popover);
      transition:
        opacity 0.2s ease,
        translate 0.2s ease;

      @starting-style {
        opacity: 0;
        translate: 0 var(--space-8);
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    }

    .check {
      --icon-size: 1rem;

      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      // The green of the stock status dot, since a toast always means that something worked.
      background: var(--color-feedback-success);
      color: var(--color-icon-inverse);
    }

    .text {
      flex: 1;
      min-width: 0;
      margin: 0;
      overflow-wrap: anywhere;
    }

    button {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
    }
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      if (this.toast.current()) {
        this.startTimer();
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected startTimer(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.close(), SHOW_FOR_MS);
  }

  protected pause(): void {
    clearTimeout(this.timer);
  }

  protected close(): void {
    clearTimeout(this.timer);
    this.toast.hide();
  }
}

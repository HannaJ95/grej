import { afterRenderEffect, Component, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';
import { Button } from '../button/button';
import { IconButton } from '../icon-button/icon-button';

// Shows ConfirmService's question in a modal <dialog>: the browser keeps the focus inside it,
// Escape closes it, and the focus goes back to the button that asked when it closes. Used once,
// in AdminLayout.
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button, IconButton],
  template: `
    @let q = confirm.question();
    <dialog
      #dialog
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (close)="confirm.reply(false)"
    >
      <div class="head">
        <h2 class="text-display-xs" id="confirm-title">{{ q?.title }}</h2>
        <button
          appIconButton
          icon="close"
          type="button"
          aria-label="Stäng"
          (click)="choose(false)"
        ></button>
      </div>
      <p class="text-body-m" id="confirm-message">{{ q?.message }}</p>
      @if (q?.hint; as hint) {
        <p class="hint text-body-s">{{ hint }}</p>
      }
      <div class="actions">
        <!-- autofocus: Enter on an open dialog never removes anything by mistake. -->
        <button appButton variant="secondary" size="large" type="button" autofocus (click)="choose(false)">
          {{ q?.cancelLabel ?? 'Avbryt' }}
        </button>
        <button
          appButton
          size="large"
          type="button"
          [variant]="q?.tone === 'primary' ? 'primary' : 'danger'"
          (click)="choose(true)"
        >
          {{ q?.confirmLabel }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(36rem, 100% - 2 * var(--layout-margin));
      max-width: none;
      padding: var(--space-24);
      border: var(--border-width-strong) solid var(--color-border-default);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);

      @media (width >= 48rem) {
        padding: var(--space-32);
      }
    }

    dialog[open] {
      display: flex;
      flex-direction: column;
      gap: var(--space-16);
    }

    dialog::backdrop {
      background: var(--color-overlay-scrim);
    }

    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-24);
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .hint {
      color: var(--color-text-secondary);
    }

    // Under each other and full width on a phone, side by side on the right from a tablet.
    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-12);
      margin-top: var(--space-8);

      @media (width >= 48rem) {
        flex-direction: row;
        justify-content: flex-end;
        gap: var(--space-16);
      }
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    // After render, so the question's texts are in place when the dialog opens.
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.confirm.question() && !dialog.open) {
        dialog.showModal();
      }
    });
  }

  // The answer reaches the page only after this method, so close() has already put the focus
  // back on the asking button, and the page can move it, e.g. when that button disappears. The
  // close event's reply(false) then finds nothing left to answer.
  protected choose(yes: boolean): void {
    this.confirm.reply(yes);
    this.dialog().nativeElement.close();
  }
}

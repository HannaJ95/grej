import { Component, ElementRef, input, viewChild } from '@angular/core';
import { Button } from '../../../shared/button/button';

// The filter on phones and tablets: a button and a panel from the left, a native <dialog> like
// CartDrawer. The filter is projected, and every choice updates the list behind the panel at once.
@Component({
  selector: 'app-filter-drawer',
  imports: [Button],
  templateUrl: './filter-drawer.html',
  styleUrls: ['./filter-drawer.scss', '../drawer.scss'],
})
export class FilterDrawer {
  readonly choices = input.required<number>();
  // Undefined until the list has answered.
  readonly resultCount = input<number>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected open(): void {
    this.dialog().nativeElement.showModal();
  }

  // Public, so the projected filter's close button can call it.
  close(): void {
    this.dialog().nativeElement.close();
  }

  // The panel covers the whole dialog, so a click on the dialog itself is on the backdrop.
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}

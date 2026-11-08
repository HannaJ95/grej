import { Component, input, signal } from '@angular/core';
import { Icon } from '../../../shared/icons/icon';

// The column and the phone panel both show the filter, so each group needs ids of its own.
let nextId = 0;

// One group in the product filter: a heading whose button folds the content, like an accordion.
// <app-filter-group heading="Material">…</app-filter-group>
@Component({
  selector: 'app-filter-group',
  imports: [Icon],
  template: `
    <h3 class="text-display-2xs" [id]="id + '-heading'">
      <button
        type="button"
        class="fold"
        [attr.aria-controls]="id"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        {{ heading() }}
        <app-icon [name]="open() ? 'minus' : 'plus'" />
      </button>
    </h3>
    <!-- hidden instead of @if, so aria-controls always points at an element. -->
    <div role="group" [id]="id" [attr.aria-labelledby]="id + '-heading'" [hidden]="!open()">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-16);
      padding-block: var(--space-20) var(--space-24);
      border-top: var(--border-width-default) solid var(--color-border-default);
    }

    h3 {
      margin: 0;
    }

    // font: inherit keeps the heading's text style.
    .fold {
      --icon-size: 1.25rem;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-12);
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      font: inherit;
      text-align: start;
      text-transform: inherit;
      cursor: pointer;
    }
  `,
})
export class FilterGroup {
  readonly heading = input.required<string>();

  protected readonly id = `filter-group-${nextId++}`;
  protected readonly open = signal(true);
}

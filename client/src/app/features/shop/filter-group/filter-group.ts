import { Component, input, OnInit, signal } from '@angular/core';
import { Icon } from '../../../shared/icons/icon';

// The column and the phone panel both show the filter, so each group needs ids of its own.
let nextId = 0;

// One group in the product filter: a heading whose button folds the content, like an accordion.
// <app-filter-group heading="Material" [startOpen]="false">…</app-filter-group>
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
    <!-- inert takes the folded content out of the tab order and away from screen readers. -->
    <div
      class="panel"
      role="group"
      [id]="id"
      [attr.aria-labelledby]="id + '-heading'"
      [class.open]="open()"
      [attr.inert]="open() ? null : ''"
    >
      <div class="clip">
        <div class="content"><ng-content /></div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-block: var(--space-20);
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

    // A row of 0fr → 1fr animates the height between 0 and the content's own height.
    .panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.2s ease;

      &.open {
        grid-template-rows: 1fr;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    }

    // min-height: 0 lets the row shrink to 0. The padding gives the focus ring room inside the
    // clip, and the margin puts the content back in its place.
    .clip {
      min-height: 0;
      margin-inline: calc(-1 * var(--space-4));
      padding-inline: var(--space-4);
      overflow: hidden;
    }

    // Inside the clip, so the space above the content folds away with it. The bottom padding is
    // room for the focus ring.
    .content {
      padding-block: var(--space-16) var(--space-4);
    }
  `,
})
export class FilterGroup implements OnInit {
  readonly heading = input.required<string>();
  // Read once, so the group never folds by itself while the customer uses it.
  readonly startOpen = input(true);

  protected readonly id = `filter-group-${nextId++}`;
  protected readonly open = signal(true);

  ngOnInit(): void {
    this.open.set(this.startOpen());
  }
}

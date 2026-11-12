import { Component } from '@angular/core';
import { Icon } from '../icons/icon';

// The heading is fixed; each page explains the demo in its own words as content.
@Component({
  selector: 'app-demo-notice',
  imports: [Icon],
  template: `
    <span class="icon"><app-icon name="arrow-right" /></span>
    <div class="text">
      <p class="text-heading-xs">Det här är en demobutik</p>
      <p class="text-body-s"><ng-content /></p>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: var(--space-14);
      padding: var(--space-16) var(--space-20) var(--space-16) var(--space-16);
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
    }

    .icon {
      --icon-size: 1rem;

      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      background: var(--color-bg-inverse);
      color: var(--color-text-on-inverse);
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      min-width: 0;
    }

    p {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class DemoNotice {}

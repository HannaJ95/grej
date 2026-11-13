import { Component, DestroyRef, DOCUMENT, ElementRef, inject, input } from '@angular/core';

// <app-admin-page-header eyebrow="Kategorier" title="Huvudkategorier">
//   <button appButton>…</button>
// </app-admin-page-header>
@Component({
  selector: 'app-admin-page-header',
  template: `
    <div class="title">
      <p class="eyebrow text-mono-s-caps">{{ eyebrow() }}</p>
      <h1 class="text-display-xs">{{ title() }}</h1>
    </div>
    <ng-content />
  `,
  styles: `
    // The negative margins cancel the padding on <main>, so the border spans its full width.
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-24);
      margin: calc(-1 * var(--space-24)) calc(-1 * var(--layout-admin-gutter)) var(--space-32);
      padding: var(--space-24) var(--layout-admin-gutter);
      border-bottom: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-page);

      @media (width >= 64rem) and (height >= 30rem) {
        position: sticky;
        top: 0;
        z-index: 1;
      }
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      min-width: 0;
    }

    .eyebrow {
      margin: 0;
      color: var(--color-text-secondary);
    }

    // With large text one word ("Beställningar") can be wider than a phone.
    h1 {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class AdminPageHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const rootStyle = inject(DOCUMENT).documentElement.style;

    // The sticky offsets in _base.scss need the height, which grows when the row wraps.
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize[0].blockSize;
      rootStyle.setProperty('--admin-page-header-height', `${height}px`);
    });
    observer.observe(host);

    inject(DestroyRef).onDestroy(() => {
      observer.disconnect();
      rootStyle.removeProperty('--admin-page-header-height');
    });
  }
}

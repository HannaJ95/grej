import { Component, input } from '@angular/core';

// The icons from the design (Figma: Icon), 24 × 24 px with a 2 px line. The files are in
// public/icons/.
export type IconName =
  | 'close'
  | 'plus'
  | 'minus'
  | 'check'
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'search';

// One icon, in the color of the text around it. The svg file is used as a mask: the browser
// paints currentColor through the icon's shape, so the same file works on light and dark
// backgrounds without a copy per color. Always decoration, so screen readers skip it; the
// button or link it is in has the text.
@Component({
  selector: 'app-icon',
  host: {
    'aria-hidden': 'true',
    '[style.--icon-url]': '`url(/icons/${name()}.svg)`',
  },
  template: '',
  styles: `
    :host {
      display: inline-block;
      flex-shrink: 0;
      width: var(--icon-size, 1.5rem);
      height: var(--icon-size, 1.5rem);
      background: currentColor;
      mask: var(--icon-url) center / contain no-repeat;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}

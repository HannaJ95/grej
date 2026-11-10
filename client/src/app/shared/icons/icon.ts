import { Component, input } from '@angular/core';

// The files in public/icons/.
export type IconName =
  | 'close'
  | 'plus'
  | 'minus'
  | 'check'
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-up-right'
  | 'search'
  | 'info';

// The svg is a mask over currentColor, so one file works in every text color. Always
// decoration: the button or link around it has the text.
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

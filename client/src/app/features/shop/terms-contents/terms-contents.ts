import {
  afterNextRender,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../../shared/icons/icon';
import { TermsSection } from '../terms-page/terms-sections';

// Villkor's Innehåll: a list from 1024 px, and below that "Hoppa till avsnitt", which sticks below
// the header. <app-terms-contents [sections]="sections" [current]="current()" />
@Component({
  selector: 'app-terms-contents',
  imports: [Icon],
  templateUrl: './terms-contents.html',
  styleUrls: ['./terms-contents.scss', '../../../shared/select.scss'],
})
export class TermsContents {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly sections = input.required<TermsSection[]>();
  // The id of the section being read.
  readonly current = input.required<string>();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const rootStyle = this.document.documentElement.style;
    const setHeight = (height: number) =>
      rootStyle.setProperty('--terms-contents-height', `${height}px`);

    // The page's headings keep this far below the bar where it sticks (scroll-margin-top).
    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0].blockSize));
    observer.observe(host);
    // The router scrolls to a #fragment in the URL before the observer's first answer.
    afterNextRender(() => setHeight(host.offsetHeight));

    inject(DestroyRef).onDestroy(() => {
      observer.disconnect();
      rootStyle.removeProperty('--terms-contents-height');
    });
  }

  // A plain link instead of routerLink, since the router always jumps. A click with ctrl, cmd or
  // shift still opens the link in a new tab or window.
  protected goTo(event: MouseEvent, id: string): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.scrollTo(id);
  }

  // Chrome's styled list gives the focus back to the select after the change, which would stop the
  // scroll and take the focus from the heading. So the scroll starts right after that.
  protected choose(id: string): void {
    setTimeout(() => this.scrollTo(id));
  }

  private scrollTo(id: string): void {
    const heading = this.document.getElementById(id);
    if (!heading) {
      return;
    }
    const reduceMotion = this.document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches;
    heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    // Keyboard users continue from the section.
    heading.focus({ preventScroll: true });
    // Puts #id in the address, without the router scrolling as well.
    void this.router.navigate(['/villkor'], { fragment: id, scroll: 'manual' });
  }
}

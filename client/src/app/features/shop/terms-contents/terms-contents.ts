import { Component, DOCUMENT, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TermsSection } from '../terms-page/terms-sections';

// Villkor's Innehåll. <app-terms-contents [sections]="sections" [current]="current()" />
@Component({
  selector: 'app-terms-contents',
  templateUrl: './terms-contents.html',
  styleUrl: './terms-contents.scss',
})
export class TermsContents {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly sections = input.required<TermsSection[]>();
  // The id of the section being read.
  readonly current = input.required<string>();

  // A plain link instead of routerLink, since the router always jumps. A click with ctrl, cmd or
  // shift still opens the link in a new tab or window.
  protected goTo(event: MouseEvent, id: string): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.scrollTo(id);
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

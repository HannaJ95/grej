import { Component, DOCUMENT, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, Scroll } from '@angular/router';
import { filter } from 'rxjs';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { DemoNotice } from '../../../shared/demo-notice/demo-notice';
import { TermsContents } from '../terms-contents/terms-contents';
import { TERMS_SECTIONS } from './terms-sections';

@Component({
  selector: 'app-terms-page',
  imports: [Breadcrumb, DemoNotice, TermsContents],
  templateUrl: './terms-page.html',
  styleUrls: ['../page-hero.scss', './terms-page.scss'],
  host: { class: 'page-width', '(window:scroll)': 'updateCurrent()' },
})
export class TermsPage {
  private readonly document = inject(DOCUMENT);
  private readonly headings = viewChildren<ElementRef<HTMLElement>>('heading');

  protected readonly sections = TERMS_SECTIONS;

  // The id of the section being read, which Innehåll marks.
  protected readonly current = signal(TERMS_SECTIONS[0].id);

  constructor() {
    // The router scrolls to a #fragment in the URL without the headings' scroll-margin-top, so
    // the heading would be under "Hoppa till avsnitt" on a phone. Not when the router restores a
    // place (Back) or leaves the scrolling to the page (scroll: 'manual').
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof Scroll),
        filter((event) => !!event.anchor && !event.position && event.scrollBehavior !== 'manual'),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        // The event reaches this page before the router has scrolled. A microtask runs right
        // after that, before anything is drawn.
        queueMicrotask(() => this.document.getElementById(event.anchor!)?.scrollIntoView());
      });
  }

  // The last heading that has reached the line where a link scrolls it to: below the header and,
  // on a phone, below "Hoppa till avsnitt". +1 for rounding. Before the first heading, the first
  // section.
  protected updateCurrent(): void {
    const headings = this.headings().map((heading) => heading.nativeElement);
    const padding = parseFloat(getComputedStyle(this.document.documentElement).scrollPaddingTop);
    const margin = headings[0] ? parseFloat(getComputedStyle(headings[0]).scrollMarginTop) : 0;
    const line = (padding || 0) + (margin || 0) + 1;
    const passed = headings.filter((heading) => heading.getBoundingClientRect().top <= line);
    this.current.set(passed.at(-1)?.id ?? TERMS_SECTIONS[0].id);
  }
}

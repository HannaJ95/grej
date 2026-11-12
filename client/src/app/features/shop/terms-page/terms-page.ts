import { Component, DOCUMENT, ElementRef, inject, signal, viewChildren } from '@angular/core';
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
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly headings = viewChildren<ElementRef<HTMLElement>>('heading');

  protected readonly sections = TERMS_SECTIONS;

  // The id of the section being read, which Innehåll marks.
  protected readonly current = signal(TERMS_SECTIONS[0].id);

  // The last heading that has reached the line below what sticks at the top, where a link scrolls
  // it to. +1 for rounding. Before the first heading, the first section.
  protected updateCurrent(): void {
    const line = (parseFloat(getComputedStyle(this.root).scrollPaddingTop) || 0) + 1;
    const passed = this.headings().filter(
      (heading) => heading.nativeElement.getBoundingClientRect().top <= line,
    );
    this.current.set(passed.at(-1)?.nativeElement.id ?? TERMS_SECTIONS[0].id);
  }
}

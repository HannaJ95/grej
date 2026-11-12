import { Component, signal } from '@angular/core';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { DemoNotice } from '../../../shared/demo-notice/demo-notice';
import { TermsContents } from '../terms-contents/terms-contents';
import { TERMS_SECTIONS } from './terms-sections';

@Component({
  selector: 'app-terms-page',
  imports: [Breadcrumb, DemoNotice, TermsContents],
  templateUrl: './terms-page.html',
  styleUrls: ['../page-hero.scss', './terms-page.scss'],
  host: { class: 'page-width' },
})
export class TermsPage {
  protected readonly sections = TERMS_SECTIONS;

  // The id of the section being read, which Innehåll marks.
  protected readonly current = signal(TERMS_SECTIONS[0].id);
}

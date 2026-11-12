import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TermsSection } from '../terms-page/terms-sections';

// Villkor's Innehåll. <app-terms-contents [sections]="sections" [current]="current()" />
@Component({
  selector: 'app-terms-contents',
  imports: [RouterLink],
  templateUrl: './terms-contents.html',
  styleUrl: './terms-contents.scss',
})
export class TermsContents {
  readonly sections = input.required<TermsSection[]>();
  // The id of the section being read.
  readonly current = input.required<string>();
}

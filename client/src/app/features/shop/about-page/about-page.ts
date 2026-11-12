import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { Button } from '../../../shared/button/button';
import { DemoNotice } from '../../../shared/demo-notice/demo-notice';
import { Icon } from '../../../shared/icons/icon';

// Only says what the shop does: one seller who picks every item (scope.md).
@Component({
  selector: 'app-about-page',
  imports: [RouterLink, Breadcrumb, Button, DemoNotice, Icon],
  templateUrl: './about-page.html',
  styleUrls: ['../page-hero.scss', './about-page.scss'],
  host: { class: 'page-width' },
})
export class AboutPage {
  protected readonly values = [
    {
      title: 'Handgjort på riktigt',
      text: 'Allt i butiken är gjort av en människa, inte av en fabrik.',
    },
    {
      title: 'Små skapare',
      text: 'Grejerna kommer från små ateljéer och verkstäder. Vi väljer ut dem och säljer dem här.',
    },
    {
      title: 'Aldrig två likadana',
      text: 'Små skillnader i form, färg och yta är en del av charmen, inte ett fel.',
    },
  ];
}

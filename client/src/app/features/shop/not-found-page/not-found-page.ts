import { Component } from '@angular/core';
import { NotFound } from '../not-found/not-found';

// Every address the routes don't know, so a wrong link never gives a blank page.
@Component({
  selector: 'app-not-found-page',
  imports: [NotFound],
  template: `
    <app-not-found heading="Sidan finns inte">
      Adressen kan vara fel, eller så har sidan flyttats. Grejerna finns kvar i butiken.
    </app-not-found>
  `,
  host: { class: 'page-width' },
})
export class NotFoundPage {}

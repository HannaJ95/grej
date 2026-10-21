import { Component, input } from '@angular/core';

// The page Stripe sends the customer to after paying, e.g. /kassa/tack?order=GREJ-3F9A1C2B.
// It never says that the order is paid, since only the webhook knows that (constraints.md).
@Component({
  selector: 'app-success-page',
  template: `
    <!-- h2 for now, since app.html has the page's h1 until the layout is built. -->
    <h2>Tack för din beställning!</h2>
    @if (order()) {
      <p>Ordernummer: <strong>{{ order() }}</strong></p>
    }
    <p>Vi bekräftar din betalning just nu.</p>
  `,
})
export class SuccessPage {
  // The ?order= in the URL, set by the router (withComponentInputBinding in app.config.ts).
  readonly order = input<string>();
}


import { registerLocaleData, ViewportScroller } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeSv from '@angular/common/locales/sv';
import {
  ApplicationConfig,
  DOCUMENT,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

// Swedish number and currency formatting, e.g. "450,00 kr".
registerLocaleData(localeSv);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // A link to a #fragment lands below what sticks at the top, which _base.scss keeps in
    // scroll-padding-top for each layout.
    provideAppInitializer(() => {
      const root = inject(DOCUMENT).documentElement;
      inject(ViewportScroller).setOffset(() => [
        0,
        parseFloat(getComputedStyle(root).scrollPaddingTop) || 0,
      ]);
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'sv' },
  ]
};

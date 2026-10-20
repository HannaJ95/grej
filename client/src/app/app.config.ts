import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeSv from '@angular/common/locales/sv';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

// Swedish number and currency formatting, e.g. "450,00 kr".
registerLocaleData(localeSv);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding passes route parameters such as :id to input() in the page.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'sv' },
  ]
};

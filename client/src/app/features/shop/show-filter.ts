import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProductFilter, toQueryParams } from '../../core/product-filter';

// Returns a function that puts a filter in the URL, which the list, the tabs and the back button
// follow. Called where inject() works, e.g. in a component's field:
// private readonly show = injectShowFilter();
export function injectShowFilter(): (filter: ProductFilter) => void {
  const router = inject(Router);

  // ?sida= is removed, since the new list starts on page 1. scroll: 'manual' keeps the page still,
  // so the customer can make several choices in a row.
  return (filter) => {
    router.navigate(['/produkter'], {
      queryParams: { ...toQueryParams(filter), sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  };
}

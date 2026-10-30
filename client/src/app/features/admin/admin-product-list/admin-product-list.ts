import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminProductService } from '../../../core/admin-product.service';
import { Button } from '../../../shared/button/button';
import { toPageNumber } from '../../../shared/page-number';

// The CMS's product list, /admin/produkter. Unlike the shop's list, it shows hidden
// products and the real stock.
@Component({
  selector: 'app-admin-product-list',
  imports: [CurrencyPipe, RouterLink, Button],
  templateUrl: './admin-product-list.html',
})
export class AdminProductList {
  private readonly products = inject(AdminProductService);

  // The ?sida= in the URL, the same way as in the shop's ProductList.
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  protected readonly result = this.products.getProducts(this.page);
}

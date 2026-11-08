import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminProductService } from '../../../core/admin-product.service';
import { Button } from '../../../shared/button/button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { StockStatus } from '../../../shared/stock-status/stock-status';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';

// /admin/produkter. Unlike the shop's list, it shows hidden products and the real stock.
@Component({
  selector: 'app-admin-product-list',
  imports: [CurrencyPipe, RouterLink, Button, Pagination, StockStatus, AdminPageHeader],
  templateUrl: './admin-product-list.html',
  styleUrls: ['../admin-page.scss', '../admin-table.scss', './admin-product-list.scss'],
})
export class AdminProductList {
  private readonly products = inject(AdminProductService);

  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  protected readonly result = this.products.getProducts(this.page);
}

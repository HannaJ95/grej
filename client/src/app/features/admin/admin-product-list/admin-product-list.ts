import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminProduct, AdminProductService } from '../../../core/admin-product.service';
import { ConfirmService } from '../../../core/confirm.service';
import { Button } from '../../../shared/button/button';
import { LinkButton } from '../../../shared/link-button/link-button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { StockStatus } from '../../../shared/stock-status/stock-status';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import {
  PRODUCT_NOT_REMOVED,
  productOnOrderMessage,
  removeProductQuestion,
} from '../product-texts';

// /admin/produkter. Unlike the shop's list, it shows hidden products and the real stock.
@Component({
  selector: 'app-admin-product-list',
  imports: [
    CurrencyPipe,
    RouterLink,
    Button,
    LinkButton,
    Pagination,
    StockStatus,
    AdminPageHeader,
  ],
  templateUrl: './admin-product-list.html',
  styleUrls: ['../admin-page.scss', '../admin-table.scss', './admin-product-list.scss'],
})
export class AdminProductList {
  private readonly products = inject(AdminProductService);
  private readonly confirm = inject(ConfirmService);

  readonly page = input(1, { alias: 'sida', transform: toPageNumber });

  protected readonly result = this.products.getProducts(this.page);
  protected readonly removeError = signal<string | undefined>(undefined);
  protected readonly removedMessage = signal('');

  protected async remove(product: AdminProduct): Promise<void> {
    this.removeError.set(undefined);
    this.removedMessage.set('');
    if (!(await this.confirm.ask(removeProductQuestion(product.title)))) {
      return;
    }
    try {
      if ((await this.products.remove(product.id)) === 'onOrder') {
        this.removeError.set(productOnOrderMessage(product.title));
        return;
      }
      this.removedMessage.set(`${product.title} har tagits bort.`);
      this.result.reload();
    } catch {
      this.removeError.set(PRODUCT_NOT_REMOVED);
    }
  }
}

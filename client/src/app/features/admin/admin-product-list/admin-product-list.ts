import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdminProduct,
  AdminProductQuery,
  AdminProductService,
  isFiltered,
  toVisibility,
} from '../../../core/admin-product.service';
import { ConfirmService } from '../../../core/confirm.service';
import { toSearch } from '../../../core/product-filter';
import { DEFAULT_SORT, toSort } from '../../../core/product-sort';
import { ToastService } from '../../../core/toast.service';
import { Button } from '../../../shared/button/button';
import { toId } from '../../../shared/id-list';
import { LinkButton } from '../../../shared/link-button/link-button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { StockStatus } from '../../../shared/stock-status/stock-status';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { AdminProductFilters } from '../admin-product-filters/admin-product-filters';
import {
  PRODUCT_NOT_REMOVED,
  productOnOrderMessage,
  removeProductQuestion,
} from '../product-texts';

// /admin/produkter. Unlike the shop's list, it shows hidden products and the real stock. The
// filters use the shop's names in the URL, one id each: ?kategori=3&visa=dolda&sortera=lagst-pris.
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
    AdminProductFilters,
  ],
  templateUrl: './admin-product-list.html',
  styleUrls: ['../admin-page.scss', '../admin-table.scss', './admin-product-list.scss'],
})
export class AdminProductList {
  private readonly products = inject(AdminProductService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  readonly search = input('', { alias: 'sok', transform: toSearch });
  readonly categoryId = input(undefined, { alias: 'kategori', transform: toId });
  readonly materialId = input(undefined, { alias: 'material', transform: toId });
  readonly colorId = input(undefined, { alias: 'farg', transform: toId });
  readonly visibility = input(undefined, { alias: 'visa', transform: toVisibility });
  readonly sort = input(DEFAULT_SORT, { alias: 'sortera', transform: toSort });

  protected readonly query = computed<AdminProductQuery>(() => ({
    page: this.page(),
    search: this.search(),
    categoryId: this.categoryId(),
    materialId: this.materialId(),
    colorId: this.colorId(),
    visibility: this.visibility(),
    sort: this.sort(),
  }));

  protected readonly result = this.products.getProducts(this.query);
  protected readonly removeError = signal<string | undefined>(undefined);

  // Empty while a new answer loads, so an old count is never shown.
  protected readonly hits = computed(() => {
    if (!this.result.hasValue() || this.result.isLoading()) {
      return '';
    }
    const count = this.result.value().totalCount;
    return `${count} ${count === 1 ? 'träff' : 'träffar'}`;
  });

  protected readonly filtered = computed(() => isFiltered(this.query()));

  protected async remove(product: AdminProduct): Promise<void> {
    this.removeError.set(undefined);
    if (!(await this.confirm.ask(removeProductQuestion(product.title)))) {
      return;
    }
    try {
      if ((await this.products.remove(product.id)) === 'onOrder') {
        this.removeError.set(productOnOrderMessage(product.title));
        return;
      }
      this.toast.show(`${product.title} har tagits bort.`);
      this.result.reload();
    } catch {
      this.removeError.set(PRODUCT_NOT_REMOVED);
    }
  }
}

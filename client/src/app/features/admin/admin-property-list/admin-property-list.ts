import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { Params, Router, RouterLink } from '@angular/router';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { ConfirmService } from '../../../core/confirm.service';
import { toSearch } from '../../../core/product-filter';
import { ProductPropertyDetails, PropertyKind } from '../../../core/product-property';
import { ToastService } from '../../../core/toast.service';
import { Button } from '../../../shared/button/button';
import { toId } from '../../../shared/id-list';
import { LinkButton } from '../../../shared/link-button/link-button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { SearchField } from '../../../shared/search-field/search-field';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { AdminPropertyCard } from '../admin-property-card/admin-property-card';
import { PROPERTY_TEXTS } from '../property-texts';

// /admin/material and /admin/farger: the list, and the card that creates or renames one.
@Component({
  selector: 'app-admin-property-list',
  imports: [
    TitleCasePipe,
    RouterLink,
    Button,
    LinkButton,
    Pagination,
    SearchField,
    AdminPageHeader,
    AdminPropertyCard,
  ],
  templateUrl: './admin-property-list.html',
  styleUrls: ['../admin-page.scss', '../search-info.scss', './admin-property-list.scss'],
})
export class AdminPropertyList {
  private readonly properties = inject(AdminPropertyService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly kind = input.required<PropertyKind>();
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  readonly search = input('', { alias: 'sok', transform: toSearch });
  readonly editId = input(undefined, { alias: 'redigera', transform: toId });

  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);
  protected readonly result = this.properties.getProperties(this.kind, this.page, this.search);
  protected readonly editing = computed(() =>
    this.result.hasValue()
      ? this.result.value().items.find((p) => p.id === this.editId())
      : undefined,
  );

  // Empty while a new answer loads, so an old count is never shown.
  protected readonly hits = computed(() => {
    if (!this.search() || !this.result.hasValue() || this.result.isLoading()) {
      return '';
    }
    const count = this.result.value().totalCount;
    return `${count} ${count === 1 ? 'träff' : 'träffar'}`;
  });

  protected readonly removeError = signal<string | undefined>(undefined);

  private readonly card = viewChild.required(AdminPropertyCard);
  private readonly searchField = viewChild.required(SearchField);

  protected edit(id: number | null): void {
    this.showInCard(id);
    this.card().focusName();
  }

  protected saved(): void {
    this.result.reload();
    this.edit(null);
  }

  // E.g. ?material=2 on the product list.
  protected productParams(property: ProductPropertyDetails): Params {
    return { [this.texts().productParam]: property.id };
  }

  // A new search starts on page 1.
  protected showSearch(search: string): void {
    this.navigate({ sok: search || null, sida: null });
  }

  // The button disappears, so the focus goes to the field.
  protected clearSearch(): void {
    this.showSearch('');
    this.searchField().focus();
  }

  protected async remove(property: ProductPropertyDetails): Promise<void> {
    this.removeError.set(undefined);
    const yes = await this.confirm.ask({
      title: `Ta bort ${property.name}?`,
      message: this.removeMessage(property),
      confirmLabel: 'Ta bort',
    });
    if (!yes) {
      return;
    }
    try {
      await this.properties.remove(this.kind(), property.id);
      this.toast.show(`${property.name} har tagits bort.`);
      if (this.editId() === property.id) {
        this.showInCard(null);
      }
      this.result.reload();
    } catch {
      this.removeError.set(
        `Det gick inte att ta bort ${this.texts().theOne} just nu. Försök igen om en stund.`,
      );
    }
  }

  private showInCard(id: number | null): void {
    this.navigate({ redigera: id });
  }

  // 'merge' keeps the other parameters, and scroll: 'manual' keeps the scroll position.
  private navigate(queryParams: Params): void {
    this.router.navigate([this.texts().path], {
      queryParams,
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }

  // Products lose it too, so the message says how many have it (ambiguity.md).
  private removeMessage({ name, productCount }: ProductPropertyDetails): string {
    if (productCount === 0) {
      return `Ingen produkt har ${name}. Det går inte att ångra.`;
    }
    const { theOne } = this.texts();
    const products = productCount === 1 ? '1 produkt' : `${productCount} produkter`;
    const them = productCount === 1 ? 'den' : 'dem';
    return `${products} har ${name}, och ${theOne} tas bort från ${them} också. Det går inte att ångra.`;
  }
}

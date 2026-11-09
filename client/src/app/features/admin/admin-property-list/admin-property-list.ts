import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { ConfirmService } from '../../../core/confirm.service';
import { ToastService } from '../../../core/toast.service';
import {
  ProductProperty,
  ProductPropertyDetails,
  PropertyKind,
} from '../../../core/product-property';
import { Button } from '../../../shared/button/button';
import { toId } from '../../../shared/id-list';
import { LinkButton } from '../../../shared/link-button/link-button';
import { toPageNumber } from '../../../shared/page-number';
import { Pagination } from '../../../shared/pagination/pagination';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { AdminPropertyCard } from '../admin-property-card/admin-property-card';
import { PROPERTY_TEXTS } from '../property-texts';

// /admin/material and /admin/farger: the list, and the card that creates or renames one.
@Component({
  selector: 'app-admin-property-list',
  imports: [TitleCasePipe, Button, LinkButton, Pagination, AdminPageHeader, AdminPropertyCard],
  templateUrl: './admin-property-list.html',
  styleUrl: '../admin-page.scss',
})
export class AdminPropertyList {
  private readonly properties = inject(AdminPropertyService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly kind = input.required<PropertyKind>();
  readonly page = input(1, { alias: 'sida', transform: toPageNumber });
  readonly editId = input(undefined, { alias: 'redigera', transform: toId });

  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);
  protected readonly result = this.properties.getProperties(this.kind, this.page);
  protected readonly editing = computed(() =>
    this.result.hasValue()
      ? this.result.value().items.find((p) => p.id === this.editId())
      : undefined,
  );

  protected readonly removeError = signal<string | undefined>(undefined);

  private readonly card = viewChild.required(AdminPropertyCard);

  protected edit(id: number | null): void {
    this.showInCard(id);
    this.card().focusName();
  }

  protected saved(): void {
    this.result.reload();
    this.edit(null);
  }

  protected async remove(property: ProductProperty): Promise<void> {
    this.removeError.set(undefined);
    try {
      // The list has no product count, and the question needs one.
      const details = await this.properties.get(this.kind(), property.id);
      const yes = await this.confirm.ask({
        title: `Ta bort ${property.name}?`,
        message: this.removeMessage(details),
        confirmLabel: 'Ta bort',
      });
      if (!yes) {
        return;
      }
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

  // 'merge' keeps ?sida=, and scroll: 'manual' keeps the scroll position.
  private showInCard(id: number | null): void {
    this.router.navigate([this.texts().path], {
      queryParams: { redigera: id },
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

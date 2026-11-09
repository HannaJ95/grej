import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { Category } from '../../../core/category';
import { ConfirmService } from '../../../core/confirm.service';
import { ToastService } from '../../../core/toast.service';
import { Button } from '../../../shared/button/button';
import { toId } from '../../../shared/id-list';
import { AdminCategoryCard } from '../admin-category-card/admin-category-card';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';

// /admin/kategorier: the list and the card that creates or changes a main category.
@Component({
  selector: 'app-admin-main-categories',
  imports: [RouterLink, Button, AdminCategoryCard, AdminPageHeader],
  templateUrl: './admin-main-categories.html',
  // The same layout as AdminSubcategories.
  styleUrl: '../admin-page.scss',
})
export class AdminMainCategories {
  private readonly categories = inject(AdminCategoryService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  // ?redigera=3 in the URL: the category shown in the card. Undefined shows an empty card.
  readonly editId = input(undefined, { alias: 'redigera', transform: toId });

  // The same list as the numbers in the menu (AdminCategoryService.all).
  protected readonly result = this.categories.loadAll();
  protected readonly mainCategories = computed(() =>
    this.result.hasValue() ? this.result.value().items.filter((c) => c.parentId === null) : [],
  );
  protected readonly editing = computed(() =>
    this.mainCategories().find((c) => c.id === this.editId()),
  );

  protected readonly removeError = signal<string | undefined>(undefined);

  private readonly card = viewChild.required(AdminCategoryCard);

  // Shows the category in the card (?redigera=3), or an empty card (null), and moves the focus
  // to the card's name field. scroll: 'manual' keeps the page where it is, since the router
  // otherwise scrolls to the top when the URL changes (app.config.ts).
  protected edit(id: number | null): void {
    this.router.navigate(['/admin/kategorier'], {
      queryParams: { redigera: id },
      scroll: 'manual',
    });
    this.card().focusName();
  }

  protected async remove(category: Category): Promise<void> {
    const yes = await this.confirm.ask({
      title: `Ta bort ${category.name}?`,
      message: 'Kategorin tas bort från butiken. Det går inte att ångra.',
      confirmLabel: 'Ta bort',
    });
    if (!yes) {
      return;
    }

    this.removeError.set(undefined);
    try {
      const result = await this.categories.remove(category.id);
      if (result === 'hasProducts') {
        this.removeError.set(
          `${category.name} har produkter och kan inte tas bort. Flytta produkterna till en annan kategori först.`,
        );
        return;
      }
      if (result === 'hasSubcategories') {
        this.removeError.set(
          `${category.name} har underkategorier och kan inte tas bort. Ta bort underkategorierna först.`,
        );
        return;
      }
      this.toast.show(`${category.name} har tagits bort.`);
      // The card cannot keep showing a category that is gone.
      if (this.editId() === category.id) {
        this.router.navigate(['/admin/kategorier'], { scroll: 'manual' });
      }
    } catch {
      this.removeError.set('Kategorin kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

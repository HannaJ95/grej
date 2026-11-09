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

// /admin/underkategorier shows all subcategories under their main categories, and
// /admin/underkategorier/3 only the ones in main category 3, which the card then chooses from
// the start.
@Component({
  selector: 'app-admin-subcategories',
  imports: [RouterLink, Button, AdminCategoryCard, AdminPageHeader],
  templateUrl: './admin-subcategories.html',
  // The same layout as AdminMainCategories.
  styleUrl: '../admin-page.scss',
})
export class AdminSubcategories {
  private readonly categories = inject(AdminCategoryService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  // The :id in the URL, set by the router: the main category. Undefined on the page with all.
  readonly mainId = input(undefined, { alias: 'id', transform: toId });
  // ?redigera=5 in the URL: the subcategory shown in the card.
  readonly editId = input(undefined, { alias: 'redigera', transform: toId });

  // The same list as AdminMainCategories and the numbers in the menu.
  protected readonly result = this.categories.loadAll();
  private readonly items = computed(() =>
    this.result.hasValue() ? this.result.value().items : [],
  );
  protected readonly mainCategories = computed(() =>
    this.items().filter((c) => c.parentId === null),
  );

  // The main category of /admin/underkategorier/3, or undefined on the page with all.
  protected readonly main = computed(() =>
    this.mainCategories().find((c) => c.id === this.mainId()),
  );

  // The subcategories under their main categories. The page with all leaves out main categories
  // without subcategories; a main category's own page always shows its group, also when empty.
  protected readonly groups = computed(() => {
    const main = this.main();
    const mains = main ? [main] : this.mainId() === undefined ? this.mainCategories() : [];
    return mains
      .map((m) => ({ main: m, subcategories: this.items().filter((s) => s.parentId === m.id) }))
      .filter((group) => main !== undefined || group.subcategories.length > 0);
  });

  protected readonly editing = computed(() =>
    this.items().find((c) => c.id === this.editId() && c.parentId !== null),
  );

  protected readonly removeError = signal<string | undefined>(undefined);

  private readonly card = viewChild.required(AdminCategoryCard);

  // Like AdminMainCategories.edit, but stays on this page (with or without :id).
  protected edit(id: number | null): void {
    const mainId = this.mainId();
    this.router.navigate(
      mainId === undefined ? ['/admin/underkategorier'] : ['/admin/underkategorier', mainId],
      { queryParams: { redigera: id }, scroll: 'manual' },
    );
    this.card().focusName();
  }

  // Like AdminMainCategories.remove. A subcategory has no subcategories, so only its products
  // can stop the delete.
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
      if ((await this.categories.remove(category.id)) === 'hasProducts') {
        this.removeError.set(
          `${category.name} har produkter och kan inte tas bort. Flytta produkterna till en annan kategori först.`,
        );
        return;
      }
      this.toast.show(`${category.name} har tagits bort.`);
      if (this.editId() === category.id) {
        this.edit(null);
      }
    } catch {
      this.removeError.set('Kategorin kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

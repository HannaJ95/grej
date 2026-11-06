import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';

// What the form's fields hold.
interface CategoryFormModel {
  name: string;
  // The main category's id as text, like categoryId in the product form. '' = a main category.
  parentId: string;
}

// Creates a category (/admin/kategorier/ny), or changes and deletes one (/admin/kategorier/3).
// Built the same way as AdminProductForm.
@Component({
  selector: 'app-admin-category-form',
  imports: [FormRoot, FormField, RouterLink, Button],
  templateUrl: './admin-category-form.html',
})
export class AdminCategoryForm {
  private readonly categories = inject(AdminCategoryService);
  private readonly router = inject(Router);

  // The :id in the URL, set by the router. Undefined on /admin/kategorier/ny.
  readonly id = input<string>();
  protected readonly isNew = computed(() => this.id() === undefined);

  // The category as the API had it when the page was opened. Nothing is fetched for a new one.
  protected readonly category = this.categories.getCategory(this.id);

  // All categories (up to 100, like the product form's menu), for the main category menu.
  protected readonly categoryList = this.categories.getCategories(signal(1));

  // The choices in the menu: every main category except this one (only one level, ambiguity.md).
  protected readonly mainCategories = computed(() => {
    const items = this.categoryList.hasValue() ? this.categoryList.value().items : [];
    return items.filter((c) => c.parentId === null && String(c.id) !== this.id());
  });

  // A category with subcategories must stay a main category, so the menu is not shown.
  protected readonly hasSubcategories = computed(() => {
    const items = this.categoryList.hasValue() ? this.categoryList.value().items : [];
    return items.some((c) => c.parentId !== null && String(c.parentId) === this.id());
  });

  // Empty for a new category. Filled in again whenever the category has been fetched.
  private readonly model = linkedSignal<CategoryFormModel>(() => {
    const category = this.category.hasValue() ? this.category.value() : undefined;
    return {
      name: category?.name ?? '',
      parentId: category?.parentId == null ? '' : String(category.parentId),
    };
  });

  protected readonly categoryForm = form(
    this.model,
    // The same rules as CategoryRequest in the API.
    (field) => {
      required(field.name, { message: 'Fyll i ett namn.' });
      // required lets "   " through, as in the product form.
      pattern(field.name, /\S/, { message: 'Fyll i ett namn.' });
      maxLength(field.name, 100, { message: 'Namnet får vara högst 100 tecken.' });
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly nameError = computed(() => firstError(this.categoryForm.name));
  protected readonly saveError = computed(() => this.categoryForm().errors()[0]?.message);
  protected readonly removeError = signal<string | undefined>(undefined);

  // Runs when the form is sent and the name is valid. What it returns becomes an error
  // on the whole form, shown under the button.
  private async save() {
    const { name, parentId: chosen } = this.model();
    const parentId = chosen === '' ? null : Number(chosen);
    try {
      if (this.category.hasValue()) {
        await this.categories.update(this.category.value().id, name, parentId);
      } else {
        await this.categories.create(name, parentId);
      }
      await this.router.navigateByUrl('/admin/kategorier');
      return undefined;
    } catch {
      return {
        kind: 'save',
        message: 'Kategorin kunde inte sparas just nu. Försök igen om en stund.',
      };
    }
  }

  protected async remove(): Promise<void> {
    if (!this.category.hasValue()) {
      return;
    }
    const category = this.category.value();
    if (!confirm(`Vill du ta bort "${category.name}"? Det går inte att ångra.`)) {
      return;
    }

    this.removeError.set(undefined);
    try {
      const result = await this.categories.remove(category.id);
      if (result === 'hasProducts') {
        this.removeError.set(
          'Kategorin har produkter och kan inte tas bort. Flytta produkterna till en annan kategori först.',
        );
        return;
      }
      if (result === 'hasSubcategories') {
        this.removeError.set(
          'Kategorin har underkategorier och kan inte tas bort. Ta bort underkategorierna först.',
        );
        return;
      }
      await this.router.navigateByUrl('/admin/kategorier');
    } catch {
      this.removeError.set('Kategorin kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

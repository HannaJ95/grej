import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { Category } from '../../../core/category';
import { ToastService } from '../../../core/toast.service';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';
import { Icon } from '../../../shared/icons/icon';

interface CategoryFormModel {
  name: string;
  // Text, since a <select>'s value is text. '' = none. Only used for a subcategory.
  parentId: string;
}

// Creates a category, or changes the one in editing (?redigera= on the page).
@Component({
  selector: 'app-admin-category-card',
  imports: [FormRoot, FormField, Button, Icon],
  templateUrl: './admin-category-card.html',
  styleUrls: ['../admin-form.scss', '../../../shared/select.scss'],
})
export class AdminCategoryCard {
  private readonly categories = inject(AdminCategoryService);
  private readonly toast = inject(ToastService);

  readonly kind = input<'main' | 'sub'>('main');
  // The category to change, or undefined for a new one.
  readonly editing = input<Category>();
  // The choices in the "Huvudkategori" menu, for a subcategory.
  readonly mainCategories = input<Category[]>([]);
  // Chosen from the start for a new subcategory, e.g. on Keramik's page.
  readonly defaultParentId = input<number>();
  // So the page can show an empty card again.
  readonly saved = output();
  readonly cancelled = output();

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly texts = computed(() =>
    this.kind() === 'main'
      ? { noun: 'huvudkategori', example: 'T.ex. Belysning' }
      : { noun: 'underkategori', example: 'T.ex. Vaser' },
  );

  // Filled in again when the page changes editing or defaultParentId.
  private readonly model = linkedSignal<CategoryFormModel>(() => {
    const editing = this.editing();
    const parentId = editing ? editing.parentId : this.defaultParentId();
    return { name: editing?.name ?? '', parentId: parentId == null ? '' : String(parentId) };
  });

  // Errors wait until the admin tries to save, not just leaves a field. Another category in the
  // card starts without them.
  private readonly showErrors = linkedSignal({ source: this.editing, computation: () => false });

  protected readonly categoryForm = form(
    this.model,
    // The same rules as CategoryRequest in the API.
    (field) => {
      required(field.name, { message: 'Fyll i ett namn.' });
      // required() accepts a name of only spaces.
      pattern(field.name, /\S/, { message: 'Fyll i ett namn.' });
      maxLength(field.name, 100, { message: 'Namnet får vara högst 100 tecken.' });
      // A new subcategory must have a main category. A changed one may lose it and become a
      // main category, e.g. if it was put in the wrong place.
      required(field.parentId, {
        message: 'Välj en huvudkategori.',
        when: () => this.kind() === 'sub' && !this.editing(),
      });
    },
    { submission: { action: () => this.save(), onInvalid: () => this.showErrors.set(true) } },
  );

  protected readonly nameError = computed(() =>
    this.showErrors() ? firstError(this.categoryForm.name) : undefined,
  );
  protected readonly parentError = computed(() =>
    this.showErrors() ? firstError(this.categoryForm.parentId) : undefined,
  );
  protected readonly saveError = computed(() => this.categoryForm().errors()[0]?.message);

  // Called by the page, e.g. after "Redigera", so the admin can type at once.
  focusName(): void {
    this.nameInput().nativeElement.focus();
  }

  // A returned error becomes the form's error (saveError).
  private async save() {
    const name = this.model().name.trim();
    const chosen = this.model().parentId;
    // A main category never has a main category.
    const parentId = this.kind() === 'main' || chosen === '' ? null : Number(chosen);
    const editing = this.editing();
    try {
      if (editing) {
        await this.categories.update(editing.id, name, parentId);
        this.toast.show('Ändringarna är sparade.');
      } else {
        await this.categories.create(name, parentId);
        this.toast.show(`${name} har lagts till.`);
      }
      // The main category stays chosen, so several subcategories can be added in a row.
      this.categoryForm().reset({ name: '', parentId: editing ? '' : chosen });
      this.showErrors.set(false);
      this.saved.emit();
      return undefined;
    } catch {
      return {
        kind: 'save',
        message: 'Kategorin kunde inte sparas just nu. Försök igen om en stund.',
      };
    }
  }
}

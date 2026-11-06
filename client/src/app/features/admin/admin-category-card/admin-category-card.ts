import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { AdminCategoryService } from '../../../core/admin-category.service';
import { Category } from '../../../core/category';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';
import { Icon } from '../../../shared/icons/icon';

// What the form's fields hold.
interface CategoryFormModel {
  name: string;
  // The main category's id as text, since a <select>'s value is always text (like categoryId in
  // the product form). '' = none. Only used for a subcategory.
  parentId: string;
}

// The card next to the category list (Figma: NY HUVUDKATEGORI and NY UNDERKATEGORI). It creates
// a category, or changes the one in editing. The page decides which one, from ?redigera= in the
// URL, and with kind whether it is a main category or a subcategory.
@Component({
  selector: 'app-admin-category-card',
  imports: [FormRoot, FormField, Button, Icon],
  templateUrl: './admin-category-card.html',
  styleUrl: './admin-category-card.scss',
})
export class AdminCategoryCard {
  private readonly categories = inject(AdminCategoryService);

  readonly kind = input<'main' | 'sub'>('main');
  // The category to change, or undefined for a new one.
  readonly editing = input<Category>();
  // The choices in the "Huvudkategori" menu, for a subcategory.
  readonly mainCategories = input<Category[]>([]);
  // The main category chosen from the start for a new subcategory, e.g. on Keramik's page.
  readonly defaultParentId = input<number>();
  // Tells the page that the card is done, so it can show an empty card again.
  readonly saved = output();
  readonly cancelled = output();

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  // The words that differ between the two kinds.
  protected readonly texts = computed(() =>
    this.kind() === 'main'
      ? { noun: 'huvudkategori', example: 'T.ex. Belysning' }
      : { noun: 'underkategori', example: 'T.ex. Vaser' },
  );

  // Filled in again whenever the page changes which category is edited, or which main category
  // a new subcategory gets.
  private readonly model = linkedSignal<CategoryFormModel>(() => {
    const editing = this.editing();
    const parentId = editing ? editing.parentId : this.defaultParentId();
    return { name: editing?.name ?? '', parentId: parentId == null ? '' : String(parentId) };
  });

  protected readonly categoryForm = form(
    this.model,
    // The same rules as CategoryRequest in the API.
    (field) => {
      required(field.name, { message: 'Fyll i ett namn.' });
      // required lets "   " through, as in the product form.
      pattern(field.name, /\S/, { message: 'Fyll i ett namn.' });
      maxLength(field.name, 100, { message: 'Namnet får vara högst 100 tecken.' });
      // A new subcategory must have a main category. A changed one may lose it and become a
      // main category, e.g. if it was put in the wrong place.
      required(field.parentId, {
        message: 'Välj en huvudkategori.',
        when: () => this.kind() === 'sub' && !this.editing(),
      });
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly nameError = computed(() => firstError(this.categoryForm.name));
  protected readonly parentError = computed(() => firstError(this.categoryForm.parentId));
  protected readonly saveError = computed(() => this.categoryForm().errors()[0]?.message);
  // Read by screen readers (role="status"), and seen by everyone, after a save. It stays until
  // the next save.
  protected readonly savedMessage = signal('');

  // Called by the page, e.g. after "Redigera", so the admin can type at once.
  focusName(): void {
    this.nameInput().nativeElement.focus();
  }

  // Runs when the form is sent and the fields are valid. What it returns becomes an error on the
  // whole form, shown under the button.
  private async save() {
    const name = this.model().name.trim();
    const chosen = this.model().parentId;
    // A main category never has a main category.
    const parentId = this.kind() === 'main' || chosen === '' ? null : Number(chosen);
    const editing = this.editing();
    this.savedMessage.set('');
    try {
      if (editing) {
        await this.categories.update(editing.id, name, parentId);
        this.savedMessage.set('Ändringarna är sparade.');
      } else {
        await this.categories.create(name, parentId);
        this.savedMessage.set(`${name} har lagts till.`);
      }
      // An empty name field that is not "touched", so "Fyll i ett namn." is not shown at once.
      // The main category stays chosen, so several subcategories can be added in a row.
      this.categoryForm().reset({ name: '', parentId: editing ? '' : chosen });
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

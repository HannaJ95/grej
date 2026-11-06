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

// What the form's field holds.
interface CategoryFormModel {
  name: string;
}

// The card next to the category list (Figma: NY HUVUDKATEGORI). It creates a main category, or
// changes the one in editing. The page decides which one, from ?redigera= in the URL.
@Component({
  selector: 'app-admin-category-card',
  imports: [FormRoot, FormField, Button],
  templateUrl: './admin-category-card.html',
  styleUrl: './admin-category-card.scss',
})
export class AdminCategoryCard {
  private readonly categories = inject(AdminCategoryService);

  // The category to change, or undefined for a new one.
  readonly editing = input<Category>();
  // Tells the page that the card is done, so it can show an empty card again.
  readonly saved = output();
  readonly cancelled = output();

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  // Filled in again whenever the page changes which category is edited.
  private readonly model = linkedSignal<CategoryFormModel>(() => ({
    name: this.editing()?.name ?? '',
  }));

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
  // Read by screen readers (role="status"), and seen by everyone, after a save. It stays until
  // the next save.
  protected readonly savedMessage = signal('');

  // Called by the page, e.g. after "Redigera", so the admin can type at once.
  focusName(): void {
    this.nameInput().nativeElement.focus();
  }

  // Runs when the form is sent and the name is valid. What it returns becomes an error on the
  // whole form, shown under the button.
  private async save() {
    const name = this.model().name.trim();
    const editing = this.editing();
    this.savedMessage.set('');
    try {
      if (editing) {
        await this.categories.update(editing.id, name, editing.parentId);
        this.savedMessage.set('Ändringarna är sparade.');
      } else {
        await this.categories.create(name, null);
        this.savedMessage.set(`${name} har lagts till.`);
      }
      // An empty field that is not "touched", so "Fyll i ett namn." is not shown at once.
      this.categoryForm().reset({ name: '' });
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

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
import { AdminPropertyService } from '../../../core/admin-property.service';
import { ProductProperty, PropertyKind } from '../../../core/product-property';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';
import { PROPERTY_TEXTS } from '../property-texts';

interface PropertyFormModel {
  name: string;
}

// Creates a material or a color, or renames the one being edited.
@Component({
  selector: 'app-admin-property-card',
  imports: [FormRoot, FormField, Button],
  templateUrl: './admin-property-card.html',
  styleUrl: '../admin-form.scss',
})
export class AdminPropertyCard {
  private readonly properties = inject(AdminPropertyService);

  readonly kind = input.required<PropertyKind>();
  readonly editing = input<ProductProperty>();
  readonly saved = output();
  readonly cancelled = output();

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);

  private readonly model = linkedSignal<PropertyFormModel>(() => ({
    name: this.editing()?.name ?? '',
  }));

  // The same rules as PropertyRequest in the API.
  protected readonly propertyForm = form(
    this.model,
    (field) => {
      required(field.name, { message: 'Fyll i ett namn.' });
      // required() accepts a name of only spaces.
      pattern(field.name, /\S/, { message: 'Fyll i ett namn.' });
      maxLength(field.name, 100, { message: 'Namnet får vara högst 100 tecken.' });
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly nameError = computed(() => firstError(this.propertyForm.name));
  protected readonly saveError = computed(() => this.propertyForm().errors()[0]?.message);
  protected readonly savedMessage = signal('');

  focusName(): void {
    this.nameInput().nativeElement.focus();
  }

  // A returned error becomes the form's error (saveError).
  private async save() {
    const name = this.model().name.trim();
    const editing = this.editing();
    this.savedMessage.set('');
    try {
      if (editing) {
        await this.properties.update(this.kind(), editing.id, name);
        this.savedMessage.set('Ändringarna är sparade.');
      } else {
        await this.properties.create(this.kind(), name);
        this.savedMessage.set(`${name} har lagts till.`);
      }
      // Untouched again, so the empty field shows no error.
      this.propertyForm().reset({ name: '' });
      this.saved.emit();
      return undefined;
    } catch {
      return {
        kind: 'save',
        message: `Det gick inte att spara ${this.texts().theOne} just nu. Försök igen om en stund.`,
      };
    }
  }
}

import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { ProductPropertyDetails, PropertyKind } from '../../../core/product-property';
import { firstError } from '../../../shared/first-error';
import { PROPERTY_TEXTS } from '../property-texts';

// What the form's field holds.
interface PropertyFormModel {
  name: string;
}

// Creates a material or a color (/admin/material/ny), or renames and deletes one
// (/admin/farger/2). Built the same way as AdminCategoryForm, and like AdminPropertyList
// one component serves both lists.
@Component({
  selector: 'app-admin-property-form',
  imports: [FormRoot, FormField, RouterLink, TitleCasePipe],
  templateUrl: './admin-property-form.html',
})
export class AdminPropertyForm {
  private readonly properties = inject(AdminPropertyService);
  private readonly router = inject(Router);

  // Which list, from the route's data, as in AdminPropertyList.
  readonly kind = input.required<PropertyKind>();
  // The :id in the URL, set by the router. Undefined on /admin/farger/ny.
  readonly id = input<string>();
  protected readonly isNew = computed(() => this.id() === undefined);
  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);
  protected readonly heading = computed(() =>
    this.isNew() ? this.texts().newOne : `Redigera ${this.texts().singular}`,
  );

  // As the API had it when the page was opened, with its product count. Nothing is
  // fetched for a new one.
  protected readonly property = this.properties.getProperty(this.kind, this.id);

  // Empty for a new one. Filled in again whenever it has been fetched.
  private readonly model = linkedSignal<PropertyFormModel>(() => ({
    name: this.property.hasValue() ? this.property.value().name : '',
  }));

  protected readonly propertyForm = form(
    this.model,
    // The same rules as PropertyRequest in the API.
    (field) => {
      required(field.name, { message: 'Fyll i ett namn.' });
      // required lets "   " through, as in the product form.
      pattern(field.name, /\S/, { message: 'Fyll i ett namn.' });
      maxLength(field.name, 100, { message: 'Namnet får vara högst 100 tecken.' });
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly nameError = computed(() => firstError(this.propertyForm.name));
  protected readonly saveError = computed(() => this.propertyForm().errors()[0]?.message);
  protected readonly removeError = signal<string | undefined>(undefined);

  // Runs when the form is sent and the name is valid. What it returns becomes an error
  // on the whole form, shown under the button.
  private async save() {
    const name = this.model().name;
    try {
      if (this.property.hasValue()) {
        await this.properties.update(this.kind(), this.property.value().id, name);
      } else {
        await this.properties.create(this.kind(), name);
      }
      await this.router.navigateByUrl(this.texts().path);
      return undefined;
    } catch {
      return {
        kind: 'save',
        // "Det gick inte att …" first, so the word for the kind never starts the sentence
        // and needs no capital letter here.
        message: `Det gick inte att spara ${this.texts().theOne} just nu. Försök igen om en stund.`,
      };
    }
  }

  protected async remove(): Promise<void> {
    if (!this.property.hasValue()) {
      return;
    }
    const property = this.property.value();
    if (!confirm(this.removeQuestion(property))) {
      return;
    }

    this.removeError.set(undefined);
    try {
      await this.properties.remove(this.kind(), property.id);
      await this.router.navigateByUrl(this.texts().path);
    } catch {
      this.removeError.set(
        `Det gick inte att ta bort ${this.texts().theOne} just nu. Försök igen om en stund.`,
      );
    }
  }

  // The question in the "Are you sure?" dialog. If products have it, the question says so,
  // since they lose it too (ambiguity.md). The count is from when the page was opened.
  private removeQuestion(property: ProductPropertyDetails): string {
    const { name, productCount } = property;
    if (productCount === 0) {
      return `Vill du ta bort "${name}"? Det går inte att ångra.`;
    }

    const { theOne } = this.texts();
    const products = productCount === 1 ? '1 produkt' : `${productCount} produkter`;
    const them = productCount === 1 ? 'den' : 'dem';
    return (
      `${products} har "${name}", och ${theOne} tas bort från ${them} också. ` +
      `Vill du ändå ta bort ${theOne}? Det går inte att ångra.`
    );
  }
}

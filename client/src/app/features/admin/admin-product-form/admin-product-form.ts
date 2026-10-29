import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  max,
  maxLength,
  min,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AdminCategoryService } from '../../../core/admin-category.service';
import {
  AdminProduct,
  AdminProductService,
  ProductInput,
} from '../../../core/admin-product.service';
import { firstError } from '../../../shared/first-error';
import { AdminProductImage } from '../admin-product-image/admin-product-image';
import { PropertyCheckboxes } from '../property-checkboxes/property-checkboxes';

// What the form's fields hold. Price and stock are null while their fields are empty.
interface ProductFormModel {
  title: string;
  description: string;
  // The chosen category's id as text, since a <select>'s value is always text. '' = none chosen.
  categoryId: string;
  price: number | null;
  stock: number | null;
  isActive: boolean;
  // The ids of the ticked checkboxes.
  materialIds: number[];
  colorIds: number[];
}

// A new product starts as a hidden draft with one item, since most art is unique.
const NEW_PRODUCT: ProductFormModel = {
  title: '',
  description: '',
  categoryId: '',
  price: null,
  stock: 1,
  isActive: false,
  materialIds: [],
  colorIds: [],
};

// Creates a product (/admin/produkter/ny), or edits and deletes one (/admin/produkter/7).
@Component({
  selector: 'app-admin-product-form',
  imports: [FormRoot, FormField, RouterLink, AdminProductImage, PropertyCheckboxes],
  templateUrl: './admin-product-form.html',
})
export class AdminProductForm {
  private readonly products = inject(AdminProductService);
  private readonly categories = inject(AdminCategoryService);
  private readonly router = inject(Router);

  // The :id in the URL, set by the router. Undefined on /admin/produkter/ny.
  readonly id = input<string>();
  protected readonly isNew = computed(() => this.id() === undefined);

  // The product as the API had it when the page was opened. Nothing is fetched for a new one.
  protected readonly product = this.products.getProduct(this.id);

  // The choices in the category menu. The first page holds up to 100 categories (CategoryListQuery).
  protected readonly categoryList = this.categories.getCategories(signal(1));

  // Empty for a new product. Filled in again whenever the product has been fetched.
  private readonly model = linkedSignal<ProductFormModel>(() =>
    this.product.hasValue() ? toModel(this.product.value()) : NEW_PRODUCT,
  );

  protected readonly productForm = form(
    this.model,
    // The same rules as ProductRequest in the API.
    (field) => {
      required(field.title, { message: 'Fyll i en titel.' });
      // required lets "   " through, so the title must also contain a character that is not a space.
      pattern(field.title, /\S/, { message: 'Fyll i en titel.' });
      maxLength(field.title, 200, { message: 'Titeln får vara högst 200 tecken.' });
      maxLength(field.description, 4000, { message: 'Beskrivningen får vara högst 4000 tecken.' });
      required(field.categoryId, { message: 'Välj en kategori.' });
      required(field.price, { message: 'Fyll i ett pris.' });
      min(field.price, 0.01, { message: 'Priset måste vara större än 0.' });
      max(field.price, 999_999.99, { message: 'Priset får vara högst 999 999,99 kr.' });
      required(field.stock, { message: 'Fyll i lagersaldot.' });
      min(field.stock, 0, { message: 'Lagersaldot kan inte vara mindre än 0.' });
      max(field.stock, 10_000, { message: 'Lagersaldot får vara högst 10 000.' });
      validate(field.stock, ({ value }) => {
        const stock = value();
        return stock !== null && !Number.isInteger(stock)
          ? { kind: 'integer', message: 'Lagersaldot måste vara ett heltal.' }
          : undefined;
      });
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly titleError = computed(() => firstError(this.productForm.title));
  protected readonly descriptionError = computed(() => firstError(this.productForm.description));
  protected readonly categoryError = computed(() => firstError(this.productForm.categoryId));
  protected readonly priceError = computed(() => firstError(this.productForm.price));
  protected readonly stockError = computed(() => firstError(this.productForm.stock));
  protected readonly saveError = computed(() => this.productForm().errors()[0]?.message);
  protected readonly removeError = signal<string | undefined>(undefined);

  // Runs when the form is sent and every field is valid, like the login page. What it
  // returns becomes an error on the whole form, shown under the button.
  private async save() {
    const input = toInput(this.model());
    try {
      if (this.product.hasValue()) {
        const product = this.product.value();
        // product.stock is the stock the form was opened with.
        if ((await this.products.update(product.id, input, product.stock)) === 'stockChanged') {
          return {
            kind: 'stockChanged',
            message:
              'Lagersaldot har ändrats sedan du öppnade sidan, troligen för att någon har köpt produkten. Inget sparades. Ladda om sidan och gör ändringen igen.',
          };
        }
        await this.router.navigateByUrl('/admin/produkter');
      } else {
        // Opens the new product's page, where the admin can add an image.
        const created = await this.products.create(input);
        await this.router.navigate(['/admin/produkter', created.id]);
      }
      return undefined;
    } catch {
      return {
        kind: 'save',
        message: 'Produkten kunde inte sparas just nu. Försök igen om en stund.',
      };
    }
  }

  protected async remove(): Promise<void> {
    if (!this.product.hasValue()) {
      return;
    }
    const product = this.product.value();
    if (!confirm(`Vill du ta bort "${product.title}"? Det går inte att ångra.`)) {
      return;
    }

    this.removeError.set(undefined);
    try {
      if ((await this.products.remove(product.id)) === 'onOrder') {
        this.removeError.set(
          'Produkten finns i en order och kan inte tas bort. Dölj den i stället: avmarkera "Visa i butiken" och spara.',
        );
        return;
      }
      await this.router.navigateByUrl('/admin/produkter');
    } catch {
      this.removeError.set('Produkten kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

function toModel(product: AdminProduct): ProductFormModel {
  return {
    title: product.title,
    description: product.description,
    categoryId: String(product.categoryId),
    price: product.price,
    stock: product.stock,
    isActive: product.isActive,
    materialIds: product.materialIds,
    colorIds: product.colorIds,
  };
}

// The form is only sent when every required field is filled in, so price and stock are never
// null here, and categoryId is never ''.
function toInput(model: ProductFormModel): ProductInput {
  return {
    ...model,
    categoryId: Number(model.categoryId),
    price: model.price!,
    stock: model.stock!,
  };
}

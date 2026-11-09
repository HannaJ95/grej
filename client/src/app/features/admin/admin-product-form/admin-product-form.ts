import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
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
import { categoryLabel } from '../../../core/category';
import { ConfirmService } from '../../../core/confirm.service';
import { ToastService } from '../../../core/toast.service';
import {
  AdminProduct,
  AdminProductService,
  ProductInput,
} from '../../../core/admin-product.service';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';
import { Icon } from '../../../shared/icons/icon';
import { AdminPageHeader } from '../admin-page-header/admin-page-header';
import { AdminProductImage } from '../admin-product-image/admin-product-image';
import {
  PRODUCT_NOT_REMOVED,
  productOnOrderMessage,
  removeProductQuestion,
} from '../product-texts';
import { PropertyCheckboxes } from '../property-checkboxes/property-checkboxes';

// Price and stock are null while their fields are empty.
interface ProductFormModel {
  title: string;
  description: string;
  // Text, since a <select>'s value is always text. '' = none chosen.
  categoryId: string;
  price: number | null;
  stock: number | null;
  isActive: boolean;
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

// /admin/produkter/ny creates a product, /admin/produkter/7 edits or deletes one.
@Component({
  selector: 'app-admin-product-form',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    Button,
    Icon,
    AdminPageHeader,
    AdminProductImage,
    PropertyCheckboxes,
  ],
  templateUrl: './admin-product-form.html',
  styleUrls: [
    '../admin-page.scss',
    '../admin-form.scss',
    '../../../shared/checkbox.scss',
    './admin-product-form.scss',
  ],
})
export class AdminProductForm {
  private readonly products = inject(AdminProductService);
  private readonly categories = inject(AdminCategoryService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  // Undefined on /admin/produkter/ny.
  readonly id = input<string>();
  protected readonly isNew = computed(() => this.id() === undefined);

  // As the API has it. Nothing is fetched for a new one.
  protected readonly product = this.products.getProduct(this.id);
  protected readonly loadedProduct = computed(() =>
    this.product.hasValue() ? this.product.value() : undefined,
  );
  // E.g. an old link to a product that has been removed.
  protected readonly notFound = computed(
    () => (this.product.error() as HttpErrorResponse | undefined)?.status === 404,
  );
  // Set by create() when the product was created but its image could not be uploaded.
  protected readonly imageFailed =
    this.router.currentNavigation()?.extras.state?.['imageFailed'] === true;

  private readonly imageCard = viewChild(AdminProductImage);

  // The first page holds up to 100 categories (CategoryListQuery).
  protected readonly categoryList = this.categories.getCategories(signal(1));
  protected readonly categoryLabel = categoryLabel;

  // Filled in again whenever the product has been fetched.
  private readonly model = linkedSignal<ProductFormModel>(() =>
    this.product.hasValue() ? toModel(this.product.value()) : NEW_PRODUCT,
  );

  protected readonly productForm = form(
    this.model,
    // The same rules as ProductRequest in the API.
    (field) => {
      required(field.title, { message: 'Fyll i en titel.' });
      // required() accepts a title of only spaces.
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

  // On "Ny produkt" the image card's errors are shown together with the form's, also when the
  // form is not valid and save() never runs.
  protected showImageErrors(): void {
    if (this.isNew()) {
      this.imageCard()?.showErrors();
    }
  }

  // A returned error becomes the form's error (saveError).
  private async save() {
    const input = toInput(this.model());
    try {
      if (!this.product.hasValue()) {
        return await this.create(input);
      }
      const product = this.product.value();
      // product.stock is the stock the product had when it was last fetched.
      if ((await this.products.update(product.id, input, product.stock)) === 'stockChanged') {
        return {
          kind: 'stockChanged',
          message:
            'Lagersaldot har ändrats sedan du öppnade sidan, troligen för att någon har köpt produkten. Inget sparades. Ladda om sidan och gör ändringen igen.',
        };
      }
      this.toast.show('Ändringarna är sparade.');
      // Fetched again, so the next save compares with the stock that was just saved.
      this.product.reload();
      return undefined;
    } catch {
      return {
        kind: 'save',
        message: 'Produkten kunde inte sparas just nu. Försök igen om en stund.',
      };
    }
  }

  // Creates the product, uploads the chosen image and opens the product's own page.
  private async create(input: ProductInput) {
    const image = this.imageCard()?.pendingImage() ?? null;
    if (image === 'invalid') {
      return { kind: 'image', message: 'Rätta bilden innan du sparar.' };
    }
    const created = await this.products.create(input);
    let imageFailed = false;
    if (image) {
      try {
        await this.products.uploadImage(created.id, image.file, image.altText);
      } catch {
        // The product exists anyway, so its page opens and the image card says so.
        imageFailed = true;
      }
    }
    this.toast.show('Produkten är skapad.');
    await this.router.navigate(['/admin/produkter', created.id], { state: { imageFailed } });
    return undefined;
  }

  protected async remove(): Promise<void> {
    if (!this.product.hasValue()) {
      return;
    }
    const product = this.product.value();
    if (!(await this.confirm.ask(removeProductQuestion(product.title)))) {
      return;
    }

    this.removeError.set(undefined);
    try {
      if ((await this.products.remove(product.id)) === 'onOrder') {
        this.removeError.set(productOnOrderMessage(product.title));
        return;
      }
      this.toast.show(`${product.title} har tagits bort.`);
      await this.router.navigateByUrl('/admin/produkter');
    } catch {
      this.removeError.set(PRODUCT_NOT_REMOVED);
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

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
  SchemaPath,
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

// The numbers are null while their fields are empty.
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
  parcel: {
    weightGrams: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
  };
}

// A new product starts as a hidden draft with one item, since most art is unique. The parcel
// starts empty, so the admin measures it instead of keeping a guess.
const NEW_PRODUCT: ProductFormModel = {
  title: '',
  description: '',
  categoryId: '',
  price: null,
  stock: 1,
  isActive: false,
  materialIds: [],
  colorIds: [],
  parcel: { weightGrams: null, lengthCm: null, widthCm: null, heightCm: null },
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
    '../../../shared/select.scss',
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
      wholeNumber(field.stock, 'Lagersaldot måste vara ett heltal.');
      // ParcelRequest in the API.
      parcelRules(field.parcel.weightGrams, 'Vikten', 'g', 100_000);
      parcelRules(field.parcel.lengthCm, 'Längden', 'cm', 300);
      parcelRules(field.parcel.widthCm, 'Bredden', 'cm', 300);
      parcelRules(field.parcel.heightCm, 'Höjden', 'cm', 300);
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly titleError = computed(() => firstError(this.productForm.title));
  protected readonly descriptionError = computed(() => firstError(this.productForm.description));
  protected readonly categoryError = computed(() => firstError(this.productForm.categoryId));
  protected readonly priceError = computed(() => firstError(this.productForm.price));
  protected readonly stockError = computed(() => firstError(this.productForm.stock));
  protected readonly weightError = computed(() => firstError(this.productForm.parcel.weightGrams));
  protected readonly lengthError = computed(() => firstError(this.productForm.parcel.lengthCm));
  protected readonly widthError = computed(() => firstError(this.productForm.parcel.widthCm));
  protected readonly heightError = computed(() => firstError(this.productForm.parcel.heightCm));
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
        // A new product has room, so the answer is never 'full'.
        await this.products.addImage(created.id, image.file, image.altText);
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
    parcel: product.parcel,
  };
}

// The form is only sent when every required field is filled in, so the numbers are never
// null here, and categoryId is never ''.
function toInput(model: ProductFormModel): ProductInput {
  const { parcel } = model;
  return {
    ...model,
    categoryId: Number(model.categoryId),
    price: model.price!,
    stock: model.stock!,
    parcel: {
      weightGrams: parcel.weightGrams!,
      lengthCm: parcel.lengthCm!,
      widthCm: parcel.widthCm!,
      heightCm: parcel.heightCm!,
    },
  };
}

// A number field also accepts e.g. 2.5.
function wholeNumber(path: SchemaPath<number | null>, message: string): void {
  validate(path, ({ value }) => {
    const number = value();
    return number !== null && !Number.isInteger(number) ? { kind: 'integer', message } : undefined;
  });
}

// "what" starts the messages, e.g. "Längden får vara högst 300 cm."
function parcelRules(path: SchemaPath<number | null>, what: string, unit: string, highest: number): void {
  required(path, { message: `Fyll i ${what.toLowerCase()}.` });
  min(path, 1, { message: `${what} måste vara minst 1 ${unit}.` });
  max(path, highest, { message: `${what} får vara högst ${highest.toLocaleString('sv-SE')} ${unit}.` });
  wholeNumber(path, `${what} måste vara ett heltal.`);
}

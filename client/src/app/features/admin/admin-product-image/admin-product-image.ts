import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { AdminProduct, AdminProductService } from '../../../core/admin-product.service';
import { ConfirmService } from '../../../core/confirm.service';
import { ToastService } from '../../../core/toast.service';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';
import { LinkButton } from '../../../shared/link-button/link-button';

// The same rules as ImageFile in the API (constraints.md). The browser only knows the file's
// name and size, so the API also reads the content to check that it really is an image.
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageFormModel {
  // Null until a file is chosen.
  file: File | null;
  altText: string;
}

const EMPTY: ImageFormModel = { file: null, altText: '' };

// The product's image card: shows, uploads and removes the image. On "Ny produkt" there is no
// product yet, so the card only collects the image, and the product form uploads it after
// creating the product (pendingImage).

// What pendingImage() gives the product form.
export type PendingImage = { file: File; altText: string } | null | 'invalid';
@Component({
  selector: 'app-admin-product-image',
  imports: [FormRoot, FormField, Button, LinkButton],
  templateUrl: './admin-product-image.html',
  styleUrls: ['../admin-form.scss', './admin-product-image.scss'],
})
export class AdminProductImage {
  private readonly products = inject(AdminProductService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  // Undefined on "Ny produkt".
  readonly product = input<AdminProduct>();
  // True on a new product's page when it was created but its image could not be uploaded.
  readonly uploadFailed = input(false);

  protected readonly isNew = computed(() => !this.product());
  // Hidden again once an upload has worked.
  protected readonly showUploadFailed = linkedSignal(() => this.uploadFailed());

  // Changed here after an upload or removal, so the product form is not fetched again.
  protected readonly image = linkedSignal(() => this.product()?.image ?? null);

  private readonly model = signal<ImageFormModel>(EMPTY);

  protected readonly imageForm = form(
    this.model,
    (field) => {
      // On "Ny produkt" the image is optional, but a file and its description go together.
      required(field.file, {
        message: 'Välj en bild.',
        when: ({ valueOf }) => !this.isNew() || valueOf(field.altText).trim() !== '',
      });
      validate(field.file, ({ value }) => {
        const file = value();
        if (file && !IMAGE_TYPES.includes(file.type)) {
          return { kind: 'imageType', message: 'Bilden måste vara en jpg, png eller webp.' };
        }
        if (file && file.size > MAX_BYTES) {
          return { kind: 'imageSize', message: 'Bilden får vara högst 5 MB.' };
        }
        return undefined;
      });
      // The same rules as the API's altText parameter.
      required(field.altText, {
        message: 'Beskriv bilden.',
        when: ({ valueOf }) => !this.isNew() || valueOf(field.file) !== null,
      });
      pattern(field.altText, /\S/, { message: 'Beskriv bilden.' });
      maxLength(field.altText, 200, { message: 'Beskrivningen får vara högst 200 tecken.' });
    },
    { submission: { action: () => this.upload() } },
  );

  protected readonly fileError = computed(() => firstError(this.imageForm.file));
  protected readonly altTextError = computed(() => firstError(this.imageForm.altText));
  protected readonly uploadError = computed(() => this.imageForm().errors()[0]?.message);
  protected readonly removeError = signal<string | undefined>(undefined);

  // Emptied after an upload.
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // [formField] cannot set a file input's value, so the chosen file is put in the form here.
  protected chooseFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageForm.file().value.set(file);
    this.imageForm.file().markAsTouched();
  }

  // Shows the fields' errors, as a send does. The product form calls it when Spara is pressed.
  showErrors(): void {
    this.imageForm.file().markAsTouched();
    this.imageForm.altText().markAsTouched();
  }

  // The chosen image, null when none is chosen, or 'invalid' after showing what is missing.
  pendingImage(): PendingImage {
    this.showErrors();
    if (this.imageForm().invalid()) {
      return 'invalid';
    }
    const { file, altText } = this.model();
    return file ? { file, altText: altText.trim() } : null;
  }

  // A returned error becomes the form's error (uploadError).
  private async upload() {
    const product = this.product();
    // Enter in a field on "Ny produkt": the image is sent with the product instead.
    if (!product) {
      return undefined;
    }
    const { file, altText } = this.model();
    try {
      this.image.set(await this.products.uploadImage(product.id, file!, altText));
      // reset also forgets "touched", so the empty fields show no errors.
      this.imageForm().reset(EMPTY);
      this.fileInput().nativeElement.value = '';
      this.showUploadFailed.set(false);
      this.toast.show('Bilden är uppladdad.');
      return undefined;
    } catch {
      return {
        kind: 'upload',
        message: 'Bilden kunde inte laddas upp just nu. Försök igen om en stund.',
      };
    }
  }

  protected async remove(): Promise<void> {
    const product = this.product();
    if (!product) {
      return;
    }
    const yes = await this.confirm.ask({
      title: 'Ta bort bilden?',
      message: 'Produkten visas utan bild tills du laddar upp en ny.',
      confirmLabel: 'Ta bort',
    });
    if (!yes) {
      return;
    }

    this.removeError.set(undefined);
    try {
      await this.products.removeImage(product.id);
      this.image.set(null);
      this.toast.show('Bilden är borttagen.');
    } catch {
      this.removeError.set('Bilden kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

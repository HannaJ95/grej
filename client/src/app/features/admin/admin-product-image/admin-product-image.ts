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
import { MAX_IMAGES, ProductImage } from '../../../core/product-image';
import { ToastService } from '../../../core/toast.service';
import { Badge } from '../../../shared/badge/badge';
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

// What pendingImage() gives the product form.
export type PendingImage = { file: File; altText: string } | null | 'invalid';

// The product's image card: lists, adds and removes the images. On "Ny produkt" there is no
// product yet, so the card only collects the first image, and the product form uploads it after
// creating the product (pendingImage).
@Component({
  selector: 'app-admin-product-image',
  imports: [FormRoot, FormField, Badge, Button, LinkButton],
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

  // Set to the API's answer after every change, so the product form is not fetched again.
  protected readonly images = linkedSignal(() => this.product()?.images ?? []);
  protected readonly isFull = computed(() => this.images().length >= MAX_IMAGES);
  protected readonly maxImages = MAX_IMAGES;

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
  protected readonly listError = signal<string | undefined>(undefined);

  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');
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
      const images = await this.products.addImage(product.id, file!, altText);
      if (images === 'full') {
        // E.g. images added in another tab.
        return {
          kind: 'full',
          message: `Produkten har redan ${MAX_IMAGES} bilder. Ladda om sidan för att se alla.`,
        };
      }
      // Before images.set, while the form is still there. reset also forgets "touched", so the
      // empty fields show no errors.
      this.imageForm().reset(EMPTY);
      this.fileInput().nativeElement.value = '';
      this.images.set(images);
      this.showUploadFailed.set(false);
      // At the limit the form is replaced by a text, so the focus would be lost with it.
      if (this.isFull()) {
        this.title().nativeElement.focus();
      }
      this.toast.show('Bilden är uppladdad.');
      return undefined;
    } catch {
      return {
        kind: 'upload',
        message: 'Bilden kunde inte laddas upp just nu. Försök igen om en stund.',
      };
    }
  }

  protected async remove(image: ProductImage, position: number): Promise<void> {
    const product = this.product();
    if (!product) {
      return;
    }
    const yes = await this.confirm.ask({
      title: 'Ta bort bilden?',
      message: removeMessage(position, this.images().length),
      confirmLabel: 'Ta bort',
    });
    if (!yes) {
      return;
    }

    this.listError.set(undefined);
    // The clicked button disappears with its image, so the focus is moved to the heading, as on
    // the order page.
    this.title().nativeElement.focus();
    try {
      this.images.set(await this.products.removeImage(product.id, image.id));
      this.toast.show('Bilden är borttagen.');
    } catch {
      this.listError.set('Bilden kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

// What the shop shows instead, since that is what the admin needs to know.
function removeMessage(position: number, count: number): string {
  if (count === 1) {
    return 'Produkten visas utan bild tills du laddar upp en ny.';
  }
  if (position === 0) {
    return 'Nästa bild blir huvudbild och visas i butikens listor.';
  }
  return 'Den tas bort från produktens bilder i butiken.';
}

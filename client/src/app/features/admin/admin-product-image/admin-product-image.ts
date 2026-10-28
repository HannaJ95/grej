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
import { firstError } from '../../../shared/first-error';

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

// The product's image on the edit page: shows it, uploads a new one and removes it.
@Component({
  selector: 'app-admin-product-image',
  imports: [FormRoot, FormField],
  templateUrl: './admin-product-image.html',
})
export class AdminProductImage {
  private readonly products = inject(AdminProductService);

  readonly product = input.required<AdminProduct>();

  // The image shown now. Starts as the product's, and is changed here after an upload or
  // removal, instead of fetching the product again, which would empty the product form above.
  protected readonly image = linkedSignal(() => this.product().image);

  private readonly model = signal<ImageFormModel>(EMPTY);

  protected readonly imageForm = form(
    this.model,
    (field) => {
      required(field.file, { message: 'Välj en bild.' });
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
      required(field.altText, { message: 'Beskriv bilden.' });
      pattern(field.altText, /\S/, { message: 'Beskriv bilden.' });
      maxLength(field.altText, 200, { message: 'Beskrivningen får vara högst 200 tecken.' });
    },
    { submission: { action: () => this.upload() } },
  );

  protected readonly fileError = computed(() => firstError(this.imageForm.file));
  protected readonly altTextError = computed(() => firstError(this.imageForm.altText));
  protected readonly uploadError = computed(() => this.imageForm().errors()[0]?.message);
  protected readonly removeError = signal<string | undefined>(undefined);

  // The <input type="file"> in the template, so it can be emptied after an upload.
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // [formField] cannot be used on <input type="file">, since a file input's value can only be
  // set by the user. So the chosen file is put in the form here instead.
  protected chooseFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageForm.file().value.set(file);
    this.imageForm.file().markAsTouched();
  }

  // Runs when the form is sent and every field is valid, like save() in the product form.
  private async upload() {
    const { file, altText } = this.model();
    try {
      this.image.set(await this.products.uploadImage(this.product().id, file!, altText));
      // Empties the form for the next image. reset also forgets "touched", so no errors show.
      this.imageForm().reset(EMPTY);
      this.fileInput().nativeElement.value = '';
      return undefined;
    } catch {
      return {
        kind: 'upload',
        message: 'Bilden kunde inte laddas upp just nu. Försök igen om en stund.',
      };
    }
  }

  protected async remove(): Promise<void> {
    if (!confirm('Vill du ta bort bilden?')) {
      return;
    }

    this.removeError.set(undefined);
    try {
      await this.products.removeImage(this.product().id);
      this.image.set(null);
    } catch {
      this.removeError.set('Bilden kunde inte tas bort just nu. Försök igen om en stund.');
    }
  }
}

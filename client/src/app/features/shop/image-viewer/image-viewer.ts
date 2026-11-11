import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  viewChild,
} from '@angular/core';
import { ProductImage } from '../../../core/product-image';
import { IconButton } from '../../../shared/icon-button/icon-button';

@Component({
  selector: 'app-image-viewer',
  imports: [IconButton],
  templateUrl: './image-viewer.html',
  styleUrl: './image-viewer.scss',
})
export class ImageViewer {
  readonly images = input.required<ProductImage[]>();
  // Two-way, so the gallery shows the image the viewer closed on.
  readonly index = model.required<number>();

  protected readonly image = computed(() => this.images()[this.index()]);

  // Width in px when zoomed, null when it fits. Another image fits again.
  protected readonly zoomWidth = linkedSignal({
    source: this.index,
    computation: (): number | null => null,
  });
  protected readonly zoomed = computed(() => this.zoomWidth() !== null);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly picture = viewChild<ElementRef<HTMLImageElement>>('picture');
  private readonly injector = inject(Injector);

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  // Everything but the image and the controls is the dimmed page.
  protected closeOnBackdrop(event: MouseEvent): void {
    if (!(event.target as Element).closest('img, button, .counter')) {
      this.close();
    }
  }

  // Goes round instead of disabling the focused button.
  protected step(by: number): void {
    const count = this.images().length;
    this.index.update((index) => (index + by + count) % count);
  }

  // Twice the fitted size, with the clicked point kept under the pointer.
  protected toggleZoom(event?: MouseEvent): void {
    const image = this.picture()?.nativeElement;
    if (this.zoomed() || !image) {
      this.zoomWidth.set(null);
      return;
    }

    const stage = this.stage().nativeElement;
    const fitted = image.getBoundingClientRect();
    const view = stage.getBoundingClientRect();
    const pointX = event?.clientX ?? fitted.left + fitted.width / 2;
    const pointY = event?.clientY ?? fitted.top + fitted.height / 2;
    // As shares, which stay the same at the zoomed size.
    const shareX = (pointX - fitted.left) / fitted.width;
    const shareY = (pointY - fitted.top) / fitted.height;

    this.zoomWidth.set(fitted.width * 2);

    // The zoomed size can only be measured once it is drawn.
    afterNextRender(
      () => {
        stage.scrollLeft = image.offsetLeft + shareX * image.offsetWidth - (pointX - view.left);
        stage.scrollTop = image.offsetTop + shareY * image.offsetHeight - (pointY - view.top);
      },
      { injector: this.injector },
    );
  }
}

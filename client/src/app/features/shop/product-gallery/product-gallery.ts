import { Component, input, linkedSignal } from '@angular/core';
import { ProductImage } from '../../../core/product-image';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ImageViewer } from '../image-viewer/image-viewer';

@Component({
  selector: 'app-product-gallery',
  imports: [IconButton, ImageViewer],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.scss',
})
export class ProductGallery {
  readonly images = input.required<ProductImage[]>();

  // Back to the first image for another product.
  protected readonly selected = linkedSignal({ source: this.images, computation: () => 0 });
}

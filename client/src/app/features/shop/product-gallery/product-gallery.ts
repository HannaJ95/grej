import { Component, input, linkedSignal } from '@angular/core';
import { ProductImage } from '../../../core/product-image';

// Built for several images, though the API has one per product so far.
@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.scss',
})
export class ProductGallery {
  readonly images = input.required<ProductImage[]>();

  // The shown image's index. Back to the first when another product's images come.
  protected readonly selected = linkedSignal({ source: this.images, computation: () => 0 });
}

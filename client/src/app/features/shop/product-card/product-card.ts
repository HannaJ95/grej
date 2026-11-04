import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/product.service';
import { Badge } from '../../../shared/badge/badge';

// One product in a list: image, title and price (Figma: Product card). Used by the start
// page and the product list, so both change when the card changes.
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, Badge],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  host: {
    '[class.sold-out]': 'product().isSoldOut',
  },
})
export class ProductCard {
  readonly product = input.required<Product>();
}

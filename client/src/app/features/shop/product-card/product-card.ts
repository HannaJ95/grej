import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { Product } from '../../../core/product.service';
import { Badge } from '../../../shared/badge/badge';
import { Icon } from '../../../shared/icons/icon';

// "Få kvar" is shown when this many or fewer are left (but not 0, which is "Slutsåld").
const FEW_LEFT = 2;

// One product in a list: image, title, price and an add button (Figma: Product card). Used
// by the start page and the product list, so both change when the card changes.
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, Badge, Icon],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  host: {
    '[class.sold-out]': 'product().isSoldOut',
  },
})
export class ProductCard {
  protected readonly cart = inject(CartService);

  readonly product = input.required<Product>();

  protected readonly fewLeft = computed(() => this.product().stock <= FEW_LEFT);
}

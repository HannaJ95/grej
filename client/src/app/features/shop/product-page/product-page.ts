import { CurrencyPipe } from '@angular/common';
import {
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { CartService } from '../../../core/cart.service';
import { Product, ProductService } from '../../../core/product.service';
import { sizeText, weightText } from '../../../core/product-size';
import { shippingCost } from '../../../core/shipping';
import { Breadcrumb } from '../../../shared/breadcrumb/breadcrumb';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';
import { QuantityStepper } from '../../../shared/quantity-stepper/quantity-stepper';
import { StockStatus } from '../../../shared/stock-status/stock-status';
import { ProductGallery } from '../product-gallery/product-gallery';

// Longer descriptions are cut short at the top of the page.
const SHORT_DESCRIPTION = 150;

@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe, Breadcrumb, Button, Icon, QuantityStepper, StockStatus, ProductGallery],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
  host: { class: 'page-width' },
})
export class ProductPage {
  private readonly products = inject(ProductService);
  private readonly document = inject(DOCUMENT);
  protected readonly cart = inject(CartService);

  // The :id from the URL, set by the router (withComponentInputBinding in app.config.ts).
  readonly id = input.required<string>();

  protected readonly product = this.products.getProduct(this.id);

  // Null when the description is short enough to show whole.
  protected readonly shortDescription = computed(() =>
    this.product.hasValue() ? shorten(this.product.value().description) : null,
  );
  protected readonly size = computed(() =>
    this.product.hasValue() ? sizeText(this.product.value().size) : null,
  );
  protected readonly weight = computed(() =>
    this.product.hasValue() ? weightText(this.product.value().size.weightGrams) : null,
  );
  // For this product alone; the cart counts the whole parcel.
  protected readonly shipping = computed(() =>
    this.product.hasValue()
      ? shippingCost([{ parcel: this.product.value().parcel, quantity: 1 }])
      : null,
  );

  // Back to 1 for each product, since the router reuses this page.
  protected readonly quantity = linkedSignal({ source: this.id, computation: () => 1 });

  private readonly description = viewChild<ElementRef<HTMLDetailsElement>>('description');

  protected addToCart(product: Product): void {
    this.cart.add(product, this.quantity());
    this.quantity.set(1);
  }

  protected showDescription(): void {
    const details = this.description()?.nativeElement;
    if (!details) {
      return;
    }
    details.open = true;
    const reduceMotion = this.document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches;
    details.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    // Keyboard users continue from the description.
    details.querySelector('summary')?.focus({ preventScroll: true });
  }
}

// Cut at the last space before the limit, without a comma or period before the "…".
function shorten(text: string): string | null {
  if (text.length <= SHORT_DESCRIPTION) {
    return null;
  }
  const space = text.lastIndexOf(' ', SHORT_DESCRIPTION);
  return text.slice(0, space > 0 ? space : SHORT_DESCRIPTION).replace(/[\s,.;:–-]+$/, '') + '…';
}

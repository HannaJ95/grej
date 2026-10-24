import { computed, Service, signal } from '@angular/core';
import { UnavailableItem } from './checkout.service';
import { Product } from './product.service';

// One row in the cart. Title and price are copied when the product is added,
// only to show them; the API always takes the price from the database.
export interface CartItem {
  productId: number;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  // The stock when the product was added, at most MAX_QUANTITY. The API checks
  // the stock again in the checkout, since it may have changed since then.
  maxQuantity: number;
}

// The API accepts 1–99 of each product (CheckoutRequest.cs).
const MAX_QUANTITY = 99;

// Where the cart is saved in the browser.
const STORAGE_KEY = 'grej.cart';

// The customer's cart, saved in localStorage so it survives a page reload.
// One instance for the whole app, so the product page and the cart drawer share it.
@Service()
export class CartService {
  // Only this class can change the cart; components read it through items.
  private readonly state = signal<CartItem[]>(load());

  readonly items = this.state.asReadonly();

  // Number of items, e.g. 2 vases + 1 plate = 3.
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  // Only for showing; the customer pays the price the API calculates.
  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  // False if the product is sold out, or all that can be bought are already in the cart.
  canAdd(product: Product): boolean {
    const inCart = this.items().find((item) => item.productId === product.id)?.quantity ?? 0;
    return inCart < maxQuantityOf(product);
  }

  add(product: Product): void {
    // A sold-out product cannot be added (constraints.md), and the quantity is
    // limited by the stock (ambiguity.md).
    if (!this.canAdd(product)) {
      return;
    }

    // The product was just fetched, so its stock is newer than the one in the cart.
    const maxQuantity = maxQuantityOf(product);
    const existing = this.items().find((item) => item.productId === product.id);
    if (existing) {
      this.save(
        this.items().map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, maxQuantity }
            : item,
        ),
      );
    } else {
      const item: CartItem = {
        productId: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        quantity: 1,
        maxQuantity,
      };
      this.save([...this.items(), item]);
    }
  }

  // Keeps the quantity between 1 and the row's maxQuantity. Use remove() to take a product out.
  setQuantity(productId: number, quantity: number): void {
    this.save(
      this.items().map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(Math.max(quantity, 1), item.maxQuantity) }
          : item,
      ),
    );
  }

  remove(productId: number): void {
    this.save(this.items().filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.save([]);
  }

  // Called when the API stops the checkout (409). Each row it lists gets the
  // quantity that is left, and rows with nothing left are removed (constraints.md).
  limitTo(unavailable: UnavailableItem[]): void {
    const availableById = new Map(unavailable.map((row) => [row.productId, row.available]));
    this.save(
      this.items()
        .map((item) => {
          const available = availableById.get(item.productId);
          return available === undefined
            ? item
            : {
                ...item,
                quantity: Math.min(item.quantity, available),
                maxQuantity: Math.min(available, MAX_QUANTITY),
              };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  // Every change goes through here, so the signal and localStorage always match.
  private save(items: CartItem[]): void {
    this.state.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The storage can be full or blocked. The cart still works until the page is reloaded.
    }
  }
}

// The most of a product that can be in the cart. Stock 0 gives 0, so a sold-out
// product can never be added.
function maxQuantityOf(product: Product): number {
  return Math.min(product.stock, MAX_QUANTITY);
}

// Reads the saved cart when the app starts. Missing or broken data gives an empty cart.
function load(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    // Carts saved before the stock limit have no maxQuantity. They get the
    // largest one, and the API's stock check fixes them in the checkout.
    return Array.isArray(saved)
      ? saved.map((item) => ({ maxQuantity: MAX_QUANTITY, ...item }))
      : [];
  } catch {
    return [];
  }
}

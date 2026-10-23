import { computed, Service, signal } from '@angular/core';
import { Product } from './product.service';

// One row in the cart. Title and price are copied when the product is added,
// only to show them; the API always takes the price from the database.
export interface CartItem {
  productId: number;
  title: string;
  price: number;
  currency: string;
  quantity: number;
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

  add(product: Product): void {
    // A sold-out product cannot be added (constraints.md).
    if (product.isSoldOut) {
      return;
    }

    const existing = this.items().find((item) => item.productId === product.id);
    if (existing) {
      this.setQuantity(product.id, existing.quantity + 1);
    } else {
      const item: CartItem = {
        productId: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        quantity: 1,
      };
      this.save([...this.items(), item]);
    }
  }

  // Keeps the quantity between 1 and MAX_QUANTITY. Use remove() to take a product out.
  setQuantity(productId: number, quantity: number): void {
    const allowed = Math.min(Math.max(quantity, 1), MAX_QUANTITY);
    this.save(
      this.items().map((item) =>
        item.productId === productId ? { ...item, quantity: allowed } : item,
      ),
    );
  }

  remove(productId: number): void {
    this.save(this.items().filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.save([]);
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

// Reads the saved cart when the app starts. Missing or broken data gives an empty cart.
function load(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

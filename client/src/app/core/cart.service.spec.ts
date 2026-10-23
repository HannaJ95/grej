import { CartService } from './cart.service';
import { Product } from './product.service';

const vase: Product = {
  id: 1,
  title: 'Vas',
  description: '',
  price: 300,
  currency: 'SEK',
  isSoldOut: false,
};
const plate: Product = {
  id: 2,
  title: 'Fat',
  description: '',
  price: 150,
  currency: 'SEK',
  isSoldOut: false,
};

describe('CartService', () => {
  // Every test starts as a new visitor with nothing saved.
  beforeEach(() => localStorage.clear());

  it('adds a product and increases the quantity when it is added again', () => {
    const cart = new CartService();

    cart.add(vase);
    cart.add(vase);
    cart.add(plate);

    expect(cart.items().map((item) => [item.productId, item.quantity])).toEqual([
      [1, 2],
      [2, 1],
    ]);
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(750);
  });

  it('does not add a sold-out product', () => {
    const cart = new CartService();

    cart.add({ ...vase, isSoldOut: true });

    expect(cart.items()).toEqual([]);
  });

  it('keeps the quantity between 1 and 99', () => {
    const cart = new CartService();
    cart.add(vase);

    cart.setQuantity(vase.id, 0);
    expect(cart.items()[0].quantity).toBe(1);

    cart.setQuantity(vase.id, 100);
    expect(cart.items()[0].quantity).toBe(99);
  });

  it('removes one product, or all of them with clear', () => {
    const cart = new CartService();
    cart.add(vase);
    cart.add(plate);

    cart.remove(vase.id);
    expect(cart.items().map((item) => item.productId)).toEqual([2]);

    cart.clear();
    expect(cart.items()).toEqual([]);
  });

  it('keeps the cart when the page is reloaded', () => {
    new CartService().add(vase);

    // A new instance reads localStorage, like the app does after a reload.
    const reloaded = new CartService();

    expect(reloaded.items()).toEqual([
      { productId: 1, title: 'Vas', price: 300, currency: 'SEK', quantity: 1 },
    ]);
  });

  it('starts empty when the saved cart is broken', () => {
    localStorage.setItem('grej.cart', 'not json');

    expect(new CartService().items()).toEqual([]);
  });
});

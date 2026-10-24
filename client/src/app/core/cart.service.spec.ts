import { CartService } from './cart.service';
import { Product } from './product.service';

const vase: Product = {
  id: 1,
  title: 'Vas',
  description: '',
  price: 300,
  currency: 'SEK',
  stock: 3,
  isSoldOut: false,
};
const plate: Product = {
  id: 2,
  title: 'Fat',
  description: '',
  price: 150,
  currency: 'SEK',
  stock: 1,
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

    cart.add({ ...vase, stock: 0, isSoldOut: true });

    expect(cart.items()).toEqual([]);
  });

  it('does not add more than the stock', () => {
    const cart = new CartService();

    cart.add(plate);
    cart.add(plate);

    expect(cart.items()[0].quantity).toBe(1);
    expect(cart.canAdd(plate)).toBe(false);
  });

  it('keeps the quantity between 1 and the stock, and at most 99', () => {
    const cart = new CartService();
    cart.add(vase);
    cart.add({ ...plate, stock: 500 });

    cart.setQuantity(vase.id, 0);
    expect(cart.items()[0].quantity).toBe(1);

    cart.setQuantity(vase.id, 4);
    expect(cart.items()[0].quantity).toBe(3);

    cart.setQuantity(plate.id, 100);
    expect(cart.items()[1].quantity).toBe(99);
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

  it('lowers or removes the rows the API says cannot be bought', () => {
    const cart = new CartService();
    cart.add(vase);
    cart.setQuantity(vase.id, 3);
    cart.add(plate);

    // Only 2 vases are left, and the plate is sold out.
    cart.limitTo([
      { productId: vase.id, available: 2 },
      { productId: plate.id, available: 0 },
    ]);

    expect(cart.items().map((item) => [item.productId, item.quantity, item.maxQuantity])).toEqual([
      [1, 2, 2],
    ]);
  });

  it('keeps the cart when the page is reloaded', () => {
    new CartService().add(vase);

    // A new instance reads localStorage, like the app does after a reload.
    const reloaded = new CartService();

    expect(reloaded.items()).toEqual([
      { productId: 1, title: 'Vas', price: 300, currency: 'SEK', quantity: 1, maxQuantity: 3 },
    ]);
  });

  it('gives a cart saved without maxQuantity the largest one', () => {
    localStorage.setItem(
      'grej.cart',
      JSON.stringify([{ productId: 1, title: 'Vas', price: 300, currency: 'SEK', quantity: 2 }]),
    );

    expect(new CartService().items()[0].maxQuantity).toBe(99);
  });

  it('starts empty when the saved cart is broken', () => {
    localStorage.setItem('grej.cart', 'not json');

    expect(new CartService().items()).toEqual([]);
  });
});

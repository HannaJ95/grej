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
  images: [],
  materials: [],
  colors: [],
  parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
  size: { lengthCm: null, widthCm: null, heightCm: null, diameterCm: null, weightGrams: null },
};
const plate: Product = {
  id: 2,
  title: 'Fat',
  description: '',
  price: 150,
  currency: 'SEK',
  stock: 1,
  isSoldOut: false,
  images: [],
  materials: [],
  colors: [],
  parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
  size: { lengthCm: null, widthCm: null, heightCm: null, diameterCm: null, weightGrams: null },
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

  it('adds several at once, but never more than the stock', () => {
    const cart = new CartService();

    cart.add(vase, 2);
    expect(cart.remaining(vase)).toBe(1);

    cart.add(vase, 5);
    expect(cart.items()[0].quantity).toBe(3);
    expect(cart.remaining(vase)).toBe(0);
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
      {
        productId: 1,
        title: 'Vas',
        price: 300,
        currency: 'SEK',
        image: null,
        quantity: 1,
        maxQuantity: 3,
        parcel: vase.parcel,
      },
    ]);
  });

  it('remembers the row that was added last, until it is forgotten', () => {
    const cart = new CartService();
    expect(cart.lastAdded()).toBeNull();

    cart.add(vase);
    cart.add(vase);
    expect(cart.lastAdded()).toMatchObject({ productId: 1, quantity: 2 });

    cart.forgetLastAdded();
    expect(cart.lastAdded()).toBeNull();
  });

  it("keeps the product's main image for the cart's picture", () => {
    const main = { id: 1, url: 'https://storage.test/vas.png', altText: 'En blå vas' };
    const side = { id: 2, url: 'https://storage.test/sida.png', altText: 'Vasen från sidan' };
    const cart = new CartService();

    cart.add({ ...vase, images: [main, side] });

    expect(cart.items()[0].image).toEqual(main);
  });

  it('gives a cart saved without maxQuantity the largest one, and no image', () => {
    localStorage.setItem(
      'grej.cart',
      JSON.stringify([{ productId: 1, title: 'Vas', price: 300, currency: 'SEK', quantity: 2 }]),
    );

    const item = new CartService().items()[0];
    expect(item.maxQuantity).toBe(99);
    expect(item.image).toBeNull();
  });

  it("shows the shipping for the rows' parcels", () => {
    const cart = new CartService();

    // One vase's volume weighs 2 625 g, two weigh 5 250 g.
    cart.add(vase);
    expect(cart.shipping()).toBe(79);
    cart.add(vase);
    expect(cart.shipping()).toBe(129);
  });

  it('has no shipping for a row saved without a parcel, until the product is added again', () => {
    localStorage.setItem(
      'grej.cart',
      JSON.stringify([{ productId: 1, title: 'Vas', price: 300, currency: 'SEK', quantity: 1 }]),
    );
    const cart = new CartService();
    expect(cart.items()[0].parcel).toBeNull();
    expect(cart.shipping()).toBeNull();

    cart.add(vase);

    expect(cart.shipping()).toBe(129);
  });

  it('starts empty when the saved cart is broken', () => {
    localStorage.setItem('grej.cart', 'not json');

    expect(new CartService().items()).toEqual([]);
  });
});

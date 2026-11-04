import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { Product } from '../../../core/product.service';
import { ProductCard } from './product-card';

describe('ProductCard', () => {
  const vase: Product = {
    id: 7,
    title: 'Vas',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: 3,
    isSoldOut: false,
    image: { url: 'https://example.com/vas.jpg', altText: 'En blå vas' },
    materials: [],
    colors: [],
  };

  async function show(product: Product): Promise<HTMLElement> {
    // The cart is saved in localStorage, so each test starts with an empty one.
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('links the title to the product and shows the image and price', async () => {
    const card = await show(vase);

    const link = card.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/produkter/7');
    expect(link.textContent).toBe('Vas');
    expect(card.querySelector('img')!.getAttribute('alt')).toBe('En blå vas');
    expect(card.querySelector('.price')!.textContent).toContain('300');
    expect(card.querySelector('app-badge')).toBeNull();
  });

  it('marks a sold-out product and cannot add it', async () => {
    const card = await show({ ...vase, stock: 0, isSoldOut: true });

    expect(card.classList).toContain('sold-out');
    expect(card.querySelector('app-badge')!.textContent).toBe('Slutsåld');
    expect(card.querySelector('.price')!.textContent).toContain('Slutsåld');
    expect(card.querySelector<HTMLButtonElement>('.add')!.disabled).toBe(true);
  });

  it('adds the product to the cart', async () => {
    const card = await show(vase);
    const add = card.querySelector<HTMLButtonElement>('.add')!;

    expect(add.getAttribute('aria-label')).toBe('Lägg Vas i varukorgen');
    add.click();

    expect(TestBed.inject(CartService).items()).toMatchObject([{ productId: 7, quantity: 1 }]);
  });
});

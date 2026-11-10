import { TestBed } from '@angular/core/testing';
import { ProductImage } from '../../../core/product-image';
import { ProductGallery } from './product-gallery';

const front: ProductImage = {
  id: 1,
  url: 'https://example.com/front.jpg',
  altText: 'Vasen framifrån',
};
const side: ProductImage = {
  id: 2,
  url: 'https://example.com/side.jpg',
  altText: 'Vasen från sidan',
};

describe('ProductGallery', () => {
  async function show(images: ProductImage[]) {
    const fixture = TestBed.createComponent(ProductGallery);
    fixture.componentRef.setInput('images', images);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the image whose small image is clicked', async () => {
    const fixture = await show([front, side]);
    const element: HTMLElement = fixture.nativeElement;
    const main = () => element.querySelector<HTMLImageElement>('img.main')!;
    const buttons = element.querySelectorAll<HTMLButtonElement>('.thumbnail');

    expect(main().alt).toBe('Vasen framifrån');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');

    buttons[1].click();
    await fixture.whenStable();

    expect(main().alt).toBe('Vasen från sidan');
    expect(buttons[1].getAttribute('aria-label')).toBe('Visa bild 2 av 2');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('shows an empty box and no small images when there is no image', async () => {
    const element: HTMLElement = (await show([])).nativeElement;

    expect(element.querySelector('span.main')).not.toBeNull();
    expect(element.querySelector('.thumbnails')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { ProductImage } from '../../../core/product-image';
import { ImageViewer } from './image-viewer';

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

describe('ImageViewer', () => {
  async function show(images: ProductImage[]) {
    const fixture = TestBed.createComponent(ImageViewer);
    fixture.componentRef.setInput('images', images);
    fixture.componentRef.setInput('index', 0);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const button = (label: string) =>
      element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    return { fixture, element, button };
  }

  it('steps round from the first image to the last and back', async () => {
    const { fixture, element, button } = await show([front, side]);
    const image = () => element.querySelector<HTMLImageElement>('.stage img')!;
    const counter = () => element.querySelector('.bottom p')!.textContent!.trim();

    expect(image().alt).toBe('Vasen framifrån');
    expect(counter()).toBe('Bild 1 av 2');

    button('Föregående bild').click();
    await fixture.whenStable();

    expect(image().alt).toBe('Vasen från sidan');
    expect(counter()).toBe('Bild 2 av 2');
    expect(fixture.componentInstance.index()).toBe(1);

    button('Nästa bild').click();
    await fixture.whenStable();

    expect(image().alt).toBe('Vasen framifrån');
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('closes on a click around the image, but not on the image or the controls', async () => {
    const { element, button } = await show([front, side]);
    // jsdom has no showModal or close, so they only set and remove open.
    const dialog = element.querySelector('dialog')!;
    dialog.close = () => dialog.removeAttribute('open');
    dialog.setAttribute('open', '');

    element.querySelector<HTMLImageElement>('.stage img')!.click();
    button('Nästa bild').click();
    element.querySelector<HTMLElement>('.counter')!.click();

    expect(dialog.hasAttribute('open')).toBe(true);

    element.querySelector<HTMLElement>('.stage')!.click();

    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('zooms with the button, and fits the next image again', async () => {
    const { fixture, element, button } = await show([front, side]);
    const zoom = button('Zooma in');
    const image = () => element.querySelector<HTMLImageElement>('.stage img')!;

    zoom.click();
    await fixture.whenStable();

    expect(zoom.getAttribute('aria-pressed')).toBe('true');
    expect(image().classList).toContain('zoomed');

    button('Nästa bild').click();
    await fixture.whenStable();

    expect(zoom.getAttribute('aria-pressed')).toBe('false');
    expect(image().classList).not.toContain('zoomed');
  });

  it('has no arrows when there is only one image', async () => {
    const { element } = await show([front]);

    expect(element.querySelector('.bottom')).toBeNull();
  });
});

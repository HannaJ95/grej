import { TestBed } from '@angular/core/testing';
import { SearchField } from './search-field';

describe('SearchField', () => {
  async function render(value = '', hint?: string) {
    const fixture = TestBed.createComponent(SearchField);
    fixture.componentRef.setInput('label', 'Sök bland grejerna');
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('hint', hint);
    const searches: string[] = [];
    fixture.componentInstance.searched.subscribe((search) => searches.push(search));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const field = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    return { element, field, searches };
  }

  it('shows the search from the URL in a search landmark, named by its label', async () => {
    const { element, field } = await render('vas');

    expect(field.value).toBe('vas');
    expect(field.getAttribute('aria-label')).toBe('Sök bland grejerna');
    expect(element.querySelector('form')!.getAttribute('role')).toBe('search');
  });

  it('shows the hint below the field and describes the field with it', async () => {
    const { element, field } = await render('', 'Sök på titel.');

    const hint = element.querySelector('.hint')!;
    expect(hint.textContent).toBe('Sök på titel.');
    expect(field.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('has no hint and no description without a hint', async () => {
    const { element, field } = await render();

    expect(element.querySelector('.hint')).toBeNull();
    expect(field.hasAttribute('aria-describedby')).toBe(false);
  });

  it('sends the text without the spaces around it when the field is committed', async () => {
    const { field, searches } = await render();

    field.value = '  blå skål ';
    field.dispatchEvent(new Event('change'));

    expect(searches).toEqual(['blå skål']);
  });

  it('stays on the page when the form is sent', async () => {
    const { element } = await render();
    const submit = new Event('submit', { cancelable: true });

    element.querySelector('form')!.dispatchEvent(submit);

    expect(submit.defaultPrevented).toBe(true);
  });
});

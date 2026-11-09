import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmQuestion, ConfirmService } from '../../core/confirm.service';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let confirm: ConfirmService;

  const question: ConfirmQuestion = {
    title: 'Ta bort Lera?',
    message: 'Det går inte att ångra.',
    confirmLabel: 'Ta bort',
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConfirmDialog);
    confirm = TestBed.inject(ConfirmService);
    await fixture.whenStable();
  });

  it('shows the question and answers yes with the red button', async () => {
    const { answer } = await ask({ ...question, hint: 'Dölj den i stället.' });

    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('h2')?.textContent).toBe('Ta bort Lera?');
    expect(dialog().textContent).toContain('Dölj den i stället.');
    expect(button('Ta bort').classList).toContain('danger');

    button('Ta bort').click();

    expect(await answer).toBe(true);
    expect(dialog().open).toBe(false);
  });

  it('answers no with Avbryt, with the cross and with Escape', async () => {
    const closeWays = [
      () => button('Avbryt').click(),
      () => dialog().querySelector<HTMLButtonElement>('[aria-label="Stäng"]')!.click(),
      // Escape makes the browser close the dialog, which sends the same close event.
      () => dialog().close(),
    ];
    for (const close of closeWays) {
      const { answer } = await ask(question);
      close();
      expect(await answer).toBe(false);
    }
  });

  it('can name the buttons after the question, with a dark button for a change', async () => {
    await ask({
      ...question,
      confirmLabel: 'Markera som skickad',
      cancelLabel: 'Behåll ordern',
      tone: 'primary',
    });

    expect(button('Behåll ordern')).toBeDefined();
    expect(button('Markera som skickad').classList).not.toContain('danger');
  });

  // Asks and waits until the dialog is shown. The answer is in an object, since an async
  // function would otherwise wait for it too.
  async function ask(q: ConfirmQuestion): Promise<{ answer: Promise<boolean> }> {
    const answer = confirm.ask(q);
    await fixture.whenStable();
    return { answer };
  }

  function dialog(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }

  function button(text: string): HTMLButtonElement {
    return [...dialog().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }
});

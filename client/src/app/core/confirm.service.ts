import { Service, signal } from '@angular/core';

export interface ConfirmQuestion {
  title: string;
  message: string;
  // A grey line under the message, e.g. a gentler way to do the same thing.
  hint?: string;
  confirmLabel: string;
  cancelLabel?: string;
  // danger (red) for what removes something, primary (dark) for other changes.
  tone?: 'danger' | 'primary';
}

// Our own confirm(): const yes = await confirm.ask({ title: 'Ta bort Lera?', ... }).
// ConfirmDialog in AdminLayout shows the question and calls reply().
@Service()
export class ConfirmService {
  readonly question = signal<ConfirmQuestion | undefined>(undefined);
  private answer?: (yes: boolean) => void;

  ask(question: ConfirmQuestion): Promise<boolean> {
    // A new question replaces one that was never answered.
    this.answer?.(false);
    this.question.set(question);
    return new Promise((resolve) => (this.answer = resolve));
  }

  reply(yes: boolean): void {
    this.answer?.(yes);
    this.answer = undefined;
    this.question.set(undefined);
  }
}

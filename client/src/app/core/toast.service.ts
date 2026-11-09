import { Service, signal } from '@angular/core';

// A short message that something worked: toast.show('Ändringarna är sparade.'). Toast in
// AdminLayout shows it and hides it again by itself. Errors are never toasts; they stay next to
// what went wrong until they are read.
@Service()
export class ToastService {
  // A new object each time, so the same text shown twice starts the timer again.
  readonly current = signal<{ text: string } | undefined>(undefined);

  show(text: string): void {
    this.current.set({ text });
  }

  hide(): void {
    this.current.set(undefined);
  }
}

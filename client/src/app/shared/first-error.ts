import { FieldTree } from '@angular/forms/signals';

// The message to show under a form field, once the user has left it or tried to send the form.
export function firstError<T>(field: FieldTree<T>): string | undefined {
  const state = field();
  if (!state.touched()) {
    return undefined;
  }
  const error = state.errors()[0];
  // Every rule in our forms has a message. Only a number field the browser cannot
  // read, e.g. "1e", gets an error without one.
  return error && (error.message ?? 'Fyll i ett giltigt värde.');
}

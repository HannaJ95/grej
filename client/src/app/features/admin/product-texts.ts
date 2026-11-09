import { ConfirmQuestion } from '../../core/confirm.service';

// Shared by the product list and the product form, which can both remove a product.

export function removeProductQuestion(title: string): ConfirmQuestion {
  return {
    title: `Ta bort ${title}?`,
    message: 'Produkten tas bort från butiken och går inte att få tillbaka.',
    hint: 'Vill du bara dölja den? Avmarkera Visa i butiken och spara i stället.',
    confirmLabel: 'Ta bort',
  };
}

// The API keeps products that are on an order (constraints.md).
export function productOnOrderMessage(title: string): string {
  return `${title} finns i en order och kan inte tas bort. Dölj den i stället: avmarkera "Visa i butiken" och spara.`;
}

export const PRODUCT_NOT_REMOVED = 'Produkten kunde inte tas bort just nu. Försök igen om en stund.';

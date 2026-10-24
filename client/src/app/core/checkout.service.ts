import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// One row in the checkout: which product and how many. Prices are never
// sent, since the API always takes them from the database.
export interface CheckoutItem {
  productId: number;
  quantity: number;
}

// A row the API cannot sell in the quantity asked for. available is how many
// can be bought right now: 0 if the product is sold out or hidden.
export interface UnavailableItem {
  productId: number;
  available: number;
}

// The JSON that POST /api/checkout returns: the payment page (200 OK), or the
// rows that stopped the checkout (409 Conflict).
export interface CheckoutResponse {
  url: string;
}
export interface CheckoutConflict {
  unavailableItems: UnavailableItem[];
}
export type CheckoutResult = CheckoutResponse | CheckoutConflict;

// Starts a payment: the API creates the order and returns Stripe's payment page.
@Service()
export class CheckoutService {
  private readonly http = inject(HttpClient);

  // Resolves with the payment page or the rows that stopped the checkout.
  // Throws if the API answers with any other error, e.g. when it is down.
  async startCheckout(items: CheckoutItem[]): Promise<CheckoutResult> {
    try {
      return await firstValueFrom(
        this.http.post<CheckoutResponse>(`${environment.apiUrl}/api/checkout`, { items }),
      );
    } catch (error) {
      // 409: the request was fine, but some products cannot be bought right now.
      if (error instanceof HttpErrorResponse && error.status === 409) {
        return error.error as CheckoutConflict;
      }
      throw error;
    }
  }
}

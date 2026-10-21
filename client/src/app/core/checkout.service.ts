import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// One row in the checkout: which product and how many. Prices are never
// sent, since the API always takes them from the database.
export interface CheckoutItem {
  productId: number;
  quantity: number;
}

// The JSON that POST /api/checkout returns.
interface CheckoutResponse {
  url: string;
}

// Starts a payment: the API creates the order and returns Stripe's payment page.
@Service()
export class CheckoutService {
  private readonly http = inject(HttpClient);

  // Resolves with the payment page's URL, or throws if the API answers with an error.
  async startCheckout(items: CheckoutItem[]): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<CheckoutResponse>(`${environment.apiUrl}/api/checkout`, { items }),
    );
    return response.url;
  }
}

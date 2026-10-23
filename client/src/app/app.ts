import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { HealthService } from './core/health.service';
import { CartDrawer } from './features/shop/cart-drawer/cart-drawer';

type ConnectionStatus = 'checking' | 'ok' | 'error';

@Component({
  imports: [RouterOutlet, RouterLink, CartDrawer],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly health = inject(HealthService);

  // Temporary check for sprint 0: calls the API once when the app starts.
  // toSignal turns the HTTP response into a signal the template can read;
  // it is 'checking' until the API answers, and 'error' if the call fails.
  protected readonly status = toSignal(
    this.health.checkDatabase().pipe(
      map((response): ConnectionStatus => (response.status === 'ok' ? 'ok' : 'error')),
      catchError(() => of<ConnectionStatus>('error')),
    ),
    { initialValue: 'checking' as ConnectionStatus },
  );
}

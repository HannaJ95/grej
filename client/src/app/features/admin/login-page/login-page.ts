import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Badge } from '../../../shared/badge/badge';
import { Button } from '../../../shared/button/button';
import { firstError } from '../../../shared/first-error';
import { Icon } from '../../../shared/icons/icon';

// /admin/logga-in. Customers never log in, since they buy as guests.
@Component({
  selector: 'app-login-page',
  imports: [FormRoot, FormField, RouterLink, Badge, Button, Icon],
  templateUrl: './login-page.html',
  styleUrls: ['../admin-page.scss', '../admin-form.scss', './login-page.scss'],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(
    this.model,
    (field) => {
      required(field.email, { message: 'Fyll i din e-postadress.' });
      email(field.email, { message: 'Fyll i en giltig e-postadress.' });
      required(field.password, { message: 'Fyll i ditt lösenord.' });
    },
    {
      // A returned error becomes the form's error (loginError).
      submission: {
        action: async () => {
          const credentials = this.model();
          try {
            if (await this.auth.login(credentials.email, credentials.password)) {
              await this.router.navigateByUrl('/admin');
              return undefined;
            }
            // The API never says which part was wrong (AuthController).
            return {
              kind: 'login',
              message:
                'Fel e-postadress eller lösenord. Efter 5 försök i rad låses kontot i 5 minuter.',
            };
          } catch {
            return {
              kind: 'login',
              message: 'Kunde inte logga in just nu. Försök igen om en stund.',
            };
          }
        },
      },
    },
  );

  protected readonly emailError = computed(() => firstError(this.loginForm.email));
  protected readonly passwordError = computed(() => firstError(this.loginForm.password));
  protected readonly loginError = computed(() => this.loginForm().errors()[0]?.message);
}

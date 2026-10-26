import { Component, computed, inject, signal } from '@angular/core';
import { email, FieldTree, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

// The admin's login page, /admin/logga-in. Customers never log in, since they buy as guests.
@Component({
  selector: 'app-login-page',
  imports: [FormRoot, FormField],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // The form's data. The inputs read and write it through [formField].
  private readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(
    this.model,
    // The rules each field must follow before the form can be sent.
    (field) => {
      required(field.email, { message: 'Fyll i din e-postadress.' });
      email(field.email, { message: 'Fyll i en giltig e-postadress.' });
      required(field.password, { message: 'Fyll i ditt lösenord.' });
    },
    {
      // Runs when the form is sent and every field is valid. What it returns
      // becomes an error on the whole form, shown under the button.
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

// The message to show under a field, once the admin has left it or tried to send the form.
function firstError(field: FieldTree<string>): string | undefined {
  const state = field();
  return state.touched() ? state.errors()[0]?.message : undefined;
}

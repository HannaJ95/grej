import { computed, DOCUMENT, inject, Service, signal } from '@angular/core';

type Theme = 'light' | 'dark';

// The script in index.html reads it too.
const STORAGE_KEY = 'grej.theme';

// The page follows the system's setting until the visitor chooses with ThemeToggle. The choice is
// <html data-theme>, which _tokens.scss reads.
@Service()
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  // Missing in the tests (jsdom), which then get a light system.
  private readonly systemQuery = inject(DOCUMENT).defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );

  private readonly system = signal<Theme>(this.systemQuery?.matches ? 'dark' : 'light');
  // Undefined while the page follows the system.
  private readonly chosen = signal(toTheme(this.root.dataset['theme']));

  readonly isDark = computed(() => (this.chosen() ?? this.system()) === 'dark');

  constructor() {
    // The service lives as long as the app, so the listener is never removed.
    this.systemQuery?.addEventListener('change', (event) =>
      this.system.set(event.matches ? 'dark' : 'light'),
    );
  }

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    // Choosing the system's own setting goes back to following it, so nothing is saved.
    const chosen = next === this.system() ? undefined : next;
    this.chosen.set(chosen);

    if (chosen) {
      this.root.dataset['theme'] = chosen;
    } else {
      delete this.root.dataset['theme'];
    }
    try {
      if (chosen) {
        localStorage.setItem(STORAGE_KEY, chosen);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // The storage can be blocked. The choice still holds until the page is reloaded.
    }
  }
}

function toTheme(value: string | undefined): Theme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

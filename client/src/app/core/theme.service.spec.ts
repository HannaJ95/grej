import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  afterEach(() => {
    delete root.dataset['theme'];
    localStorage.clear();
  });

  it('follows the system, which is light in the tests', () => {
    const theme = TestBed.inject(ThemeService);

    expect(theme.isDark()).toBe(false);
    expect(root.dataset['theme']).toBeUndefined();
  });

  it('saves dark when the visitor toggles', () => {
    const theme = TestBed.inject(ThemeService);

    theme.toggle();

    expect(theme.isDark()).toBe(true);
    expect(root.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('grej.theme')).toBe('dark');
  });

  it('follows the system again when the visitor toggles back to it', () => {
    const theme = TestBed.inject(ThemeService);

    theme.toggle();
    theme.toggle();

    expect(theme.isDark()).toBe(false);
    expect(root.dataset['theme']).toBeUndefined();
    expect(localStorage.getItem('grej.theme')).toBeNull();
  });

  it('starts from the theme that the script in index.html set', () => {
    root.dataset['theme'] = 'dark';

    const theme = TestBed.inject(ThemeService);

    expect(theme.isDark()).toBe(true);
  });
});

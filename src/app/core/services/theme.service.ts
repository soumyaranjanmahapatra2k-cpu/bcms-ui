import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.getStoredTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      localStorage.setItem('bcms_theme', t);
      this.applyTheme(t);
    });
  }

  toggle() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: AppTheme) {
    this.theme.set(theme);
  }

  init() {
    this.applyTheme(this.theme());
  }

  private getStoredTheme(): AppTheme {
    const stored = localStorage.getItem('bcms_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  private applyTheme(theme: AppTheme) {
    const html = document.documentElement;
    html.classList.add('theme-transitioning');
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    setTimeout(() => html.classList.remove('theme-transitioning'), 450);
  }
}

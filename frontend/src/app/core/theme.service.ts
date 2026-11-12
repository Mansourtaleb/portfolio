import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'dark' | 'light';
const STORAGE_KEY = 'portfolio.theme';

/** Thème sombre / clair : choix du visiteur mémorisé, sinon thème par défaut réglé dans l'admin. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<Theme>(this.stored() ?? 'dark');

  constructor() {
    this.apply(this.theme());
  }

  /** Applique le thème par défaut du site si le visiteur n'a pas encore choisi. */
  useDefault(theme: Theme): void {
    if (!this.stored()) {
      this.apply(theme);
    }
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* stockage indisponible */
    }
    this.apply(next);
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private stored(): Theme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }
}

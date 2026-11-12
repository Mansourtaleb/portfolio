import { ChangeDetectionStrategy, Component, HostListener, afterNextRender, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ThemeService } from '../core/theme.service';
import { Avatar } from '../shared/avatar';
import { Icon } from '../shared/icon';

export interface NavItem {
  key: string;
  label: string;
}

/** En-tête de la vitrine : avatar, navigation par ancres avec section active, progression, thème. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, Icon, Avatar],
  template: `
    <header class="site-header" [class.scrolled]="progress() > 0.01">
      <div class="progress" [style.transform]="'scaleX(' + progress() + ')'" aria-hidden="true"></div>
      <div class="container bar">
        <a class="logo" routerLink="/" aria-label="Accueil">
          <app-avatar [src]="avatarUrl()" [name]="name()" [size]="32" />
          <span>MT<span class="dot">.</span></span>
        </a>
        <nav class="nav" [class.open]="menuOpen()" aria-label="Navigation principale">
          @for (item of items(); track item.key) {
            <a [routerLink]="'/'" [fragment]="item.key" (click)="menuOpen.set(false)" [class.active]="active() === item.key"
              [attr.aria-current]="active() === item.key ? 'location' : null">{{ item.label }}</a>
          }
        </nav>
        <div class="actions">
          <button class="btn btn-ghost btn-icon" type="button" (click)="theme.toggle()"
            [attr.aria-label]="theme.theme() === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'">
            <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="18" />
          </button>
          @if (items().length) {
            <button class="btn btn-ghost btn-icon menu-toggle" type="button" (click)="menuOpen.set(!menuOpen())"
              [attr.aria-expanded]="menuOpen()" aria-label="Menu">
              <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="18" />
            </button>
          }
        </div>
      </div>
    </header>
  `,
  styles: `
    .site-header { position: sticky; top: 0; z-index: 40; height: var(--header-h); border-bottom: 1px solid transparent;
      background: color-mix(in srgb, var(--bg) 70%, transparent); backdrop-filter: blur(14px);
      transition: border-color 0.2s ease, background 0.2s ease; }
    .site-header.scrolled { border-bottom-color: var(--border); background: color-mix(in srgb, var(--bg) 85%, transparent); }
    .progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; transform-origin: 0 50%;
      background: linear-gradient(90deg, var(--accent-strong), var(--cyan)); transition: transform 0.1s linear; }
    .bar { height: 100%; display: flex; align-items: center; gap: 24px; }
    .logo { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 19px; color: var(--text);
      text-decoration: none; letter-spacing: -0.02em; }
    .dot { color: var(--cyan); }
    .nav { display: flex; gap: 2px; margin-left: auto; padding: 4px; border-radius: 999px; }
    .nav a { position: relative; color: var(--text-muted); font-size: 14px; font-weight: 500; padding: 7px 13px;
      border-radius: 999px; transition: color 0.2s ease, background 0.2s ease; }
    .nav a:hover { color: var(--text); text-decoration: none; }
    .nav a.active { color: var(--text); background: var(--accent-soft); }
    .nav a.active::after { content: ''; position: absolute; left: 50%; bottom: 2px; width: 4px; height: 4px; margin-left: -2px;
      border-radius: 50%; background: var(--cyan); }
    .actions { display: flex; gap: 4px; margin-left: 4px; }
    .menu-toggle { display: none; }
    @media (max-width: 760px) {
      .nav { display: none; position: absolute; top: var(--header-h); left: 0; right: 0; flex-direction: column; border-radius: 0;
        padding: 12px 20px 16px; background: var(--bg-solid); border-bottom: 1px solid var(--border); }
      .nav.open { display: flex; }
      .nav a.active::after { display: none; }
      .actions { margin-left: auto; }
      .menu-toggle { display: inline-flex; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly theme = inject(ThemeService);
  readonly items = input<NavItem[]>([]);
  readonly avatarUrl = input<string | null>(null);
  readonly name = input('Mohamed Mansour TALEB');
  protected readonly menuOpen = signal(false);
  /** Progression de lecture de la page (0 → 1). */
  protected readonly progress = signal(0);
  /** Section actuellement lue (scroll spy). */
  protected readonly active = signal<string | null>(null);

  constructor() {
    afterNextRender(() => this.onScroll());
    effect(() => {
      this.items();
      setTimeout(() => this.onScroll());
    });
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    this.progress.set(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);

    // Section active : la dernière dont le haut a dépassé le tiers supérieur de l'écran.
    const threshold = window.innerHeight * 0.35;
    let current: string | null = null;
    for (const item of this.items()) {
      const el = document.getElementById(item.key);
      if (el && el.getBoundingClientRect().top <= threshold) {
        current = item.key;
      }
    }
    if (max > 0 && doc.scrollTop >= max - 4 && this.items().length) {
      current = this.items()[this.items().length - 1].key; // bas de page : dernière section
    }
    this.active.set(current);
  }
}

import { ChangeDetectionStrategy, Component, HostListener, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ThemeService } from '../core/theme.service';
import { Icon } from '../shared/icon';

export interface NavItem {
  key: string;
  label: string;
}

/** En-tête de la vitrine : logo, navigation par ancres, bascule de thème. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, Icon],
  template: `
    <header class="site-header">
      <div class="progress" [style.transform]="'scaleX(' + progress() + ')'" aria-hidden="true"></div>
      <div class="container bar">
        <a class="logo" routerLink="/" aria-label="Accueil">{{ initials() }}<span>.</span></a>
        <nav class="nav" [class.open]="menuOpen()" aria-label="Navigation principale">
          @for (item of items(); track item.key) {
            <a [routerLink]="'/'" [fragment]="item.key" (click)="menuOpen.set(false)">{{ item.label }}</a>
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
    .site-header { position: sticky; top: 0; z-index: 40; height: var(--header-h);
      background: color-mix(in srgb, var(--bg) 82%, transparent); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); }
    .progress { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; transform-origin: 0 50%;
      background: linear-gradient(90deg, var(--accent-strong), var(--cyan)); transition: transform 0.1s linear; }
    .bar { height: 100%; display: flex; align-items: center; gap: 24px; }
    .logo { font-weight: 800; font-size: 20px; color: var(--text); text-decoration: none; letter-spacing: -0.02em; }
    .logo span { color: var(--cyan); }
    .nav { display: flex; gap: 4px; margin-left: auto; }
    .nav a { color: var(--text-muted); font-size: 14px; font-weight: 500; padding: 8px 12px; border-radius: 8px; }
    .nav a:hover { color: var(--text); background: var(--bg-soft); text-decoration: none; }
    .actions { display: flex; gap: 4px; margin-left: 4px; }
    .menu-toggle { display: none; }
    @media (max-width: 760px) {
      .nav { display: none; position: absolute; top: var(--header-h); left: 0; right: 0; flex-direction: column;
        padding: 12px 20px 16px; background: var(--bg-elevated); border-bottom: 1px solid var(--border); }
      .nav.open { display: flex; }
      .actions { margin-left: auto; }
      .menu-toggle { display: inline-flex; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  protected readonly theme = inject(ThemeService);
  readonly items = input<NavItem[]>([]);
  readonly initials = input('MT');
  protected readonly menuOpen = signal(false);
  /** Progression de lecture de la page (0 → 1). */
  protected readonly progress = signal(0);

  @HostListener('window:scroll')
  protected onScroll(): void {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    this.progress.set(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
  }
}
